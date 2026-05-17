#!/usr/bin/env python3
"""
WorldRemit Email Transaction Extractor
Extracts WorldRemit transaction data from emails and generates PDF reports for tax purposes.
"""

import imaplib
import email
from email.header import decode_header as _decode_header
import re
import json
import urllib.request
from datetime import datetime
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
import getpass

from bs4 import BeautifulSoup
from dateutil import parser as dateutil_parser
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_LEFT


KNOWN_CURRENCIES = {'UGX', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK'}


def decode_mime_str(raw: str) -> str:
    """Decode a MIME-encoded header string (handles =?utf-8?B?...?= etc.)."""
    if not raw:
        return ''
    parts = _decode_header(raw)
    result = ''
    for chunk, enc in parts:
        if isinstance(chunk, bytes):
            result += chunk.decode(enc or 'utf-8', errors='replace')
        else:
            result += str(chunk)
    return result.strip()


def fetch_eur_rates() -> Dict[str, float]:
    """
    Fetch EUR-based exchange rates from open.er-api.com.
    Returns dict where value means 1 EUR = value units of that currency.
    Falls back to approximate 2024 rates on network failure.
    """
    try:
        url = 'https://open.er-api.com/v6/latest/EUR'
        with urllib.request.urlopen(url, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            if data.get('result') == 'success':
                print(f"  Exchange rates fetched ({data.get('time_last_update_utc', 'unknown')})")
                return data['rates']
    except Exception:
        pass
    print("  Warning: Could not fetch live rates. Using approximate 2024 rates.")
    return {'UGX': 4100.0, 'USD': 1.08, 'GBP': 0.86, 'CAD': 1.47, 'AUD': 1.65, 'CHF': 0.94}


@dataclass
class WorldRemitTransaction:
    date: str
    amount: str
    currency: str
    amount_eur: str
    recipient_name: str
    transaction_number: str
    email_subject: str
    sort_key: str  # ISO date string used for sorting, not displayed


class WorldRemitExtractor:

    def __init__(self, email_address: str, password: str):
        self.email_address = email_address
        self.password = password
        self.transactions: List[WorldRemitTransaction] = []
        self.imap_server = None
        self.eur_rates: Dict[str, float] = {}

    def connect_to_email(self) -> bool:
        """Connect to email server using IMAP (auto-detects provider from email domain)."""
        provider_hint = ""
        try:
            domain = self.email_address.split('@')[-1].lower()
            if 'gmail' in domain:
                imap_host = 'imap.gmail.com'
                provider_hint = (
                    "1. Enable 2-Step Verification on your Google account\n"
                    "2. Generate an App Password at myaccount.google.com/apppasswords\n"
                    "3. Enable IMAP in Gmail Settings → See all settings → Forwarding and POP/IMAP"
                )
            elif any(x in domain for x in ('outlook', 'hotmail', 'live', 'msn')):
                imap_host = 'outlook.office365.com'
                provider_hint = (
                    "1. Enable 2-factor authentication on your Microsoft account\n"
                    "2. Generate an App Password at account.microsoft.com/security\n"
                    "3. Enable IMAP in Outlook Settings"
                )
            else:
                imap_host = f'imap.{domain}'
                provider_hint = "1. Check your email provider's IMAP settings\n2. Use an App Password"


            print(f"Connecting to {imap_host}...")
            self.imap_server = imaplib.IMAP4_SSL(imap_host, 993)
            self.imap_server.login(self.email_address, self.password)
            print("Successfully connected to email server.")
            return True

        except imaplib.IMAP4.error as e:
            print(f"IMAP login failed: {e}")
            print(f"\nTroubleshooting tips:\n{provider_hint}")
            return False
        except Exception as e:
            print(f"Connection error: {e}")
            return False

    def _to_eur(self, amount_str: str, currency: str) -> str:
        """Convert an amount string to EUR using fetched rates."""
        try:
            amount = float(amount_str)
            if currency == 'EUR':
                return f"{amount:.2f}"
            rate = self.eur_rates.get(currency, 0)
            if rate > 0:
                return f"{amount / rate:.2f}"
        except (ValueError, ZeroDivisionError):
            pass
        return 'N/A'

    def _parse_list_items(self, soup: BeautifulSoup) -> Dict:
        """
        Parse <li> bullet items to extract amount, currency, and transaction number.
        Handles two WorldRemit email formats:
          - "we're on it" checklist: transaction number / bare amount / bare currency / recipient
          - "All done" detail list: "You sent: UGX X.XX to Uganda"
        """
        result = {}
        items = [li.get_text(strip=True) for li in soup.find_all('li')]

        for i, item in enumerate(items):
            # Transaction number: "Your transaction number: 180799565"
            # or "Your WorldRemit transfer number: 189895874"
            tn_match = re.search(
                r'(?:your\s+)?(?:worldremit\s+)?(?:transfer|transaction)\s+(?:number|ID|ref)[:\s]*(\d{6,12})',
                item, re.IGNORECASE
            )
            if tn_match and 'transaction_number' not in result:
                result['transaction_number'] = tn_match.group(1)

            # "You sent: UGX 206247.00 to Uganda"
            sent_match = re.search(
                r'you\s+sent[:\s]+([A-Z]{3})\s*([\d,]+\.?\d*)',
                item, re.IGNORECASE
            )
            if sent_match and 'amount' not in result:
                result['currency'] = sent_match.group(1)
                result['amount'] = sent_match.group(2).replace(',', '')

            # Inline "UGX 206247.00" anywhere in the item
            if 'amount' not in result:
                inline = re.search(r'\b(' + '|'.join(KNOWN_CURRENCIES) + r')\s+([\d,]+\.\d{2})\b', item)
                if inline:
                    result['currency'] = inline.group(1)
                    result['amount'] = inline.group(2).replace(',', '')

            # Inline "206247.00 UGX" anywhere in the item
            if 'amount' not in result:
                inline2 = re.search(r'([\d,]+\.\d{2})\s+(' + '|'.join(KNOWN_CURRENCIES) + r')\b', item)
                if inline2:
                    result['amount'] = inline2.group(1).replace(',', '')
                    result['currency'] = inline2.group(2)

            # Bare decimal number on its own bullet (checklist format: "1162918.00")
            if 'amount' not in result and re.match(r'^[\d,]+\.\d{1,2}$', item.strip()):
                result['amount'] = item.strip().replace(',', '')
                # Next bullet might be the bare currency code ("UGX")
                if i + 1 < len(items) and items[i + 1].strip() in KNOWN_CURRENCIES:
                    result['currency'] = items[i + 1].strip()

        return result

    def _parse_text_fallback(self, text: str, subject: str) -> Dict:
        """Text-based pattern fallback when HTML list parsing comes up short."""
        result = {}

        tn_patterns = [
            r'(?:your\s+)?(?:worldremit\s+)?(?:transfer|transaction)\s+(?:number|ID|ref)[:\s]*(\d{6,12})',
            r'(?:transfer|transaction)\s+(\d{6,12})\s+has been',
            r'Reference[:\s]*([A-Z0-9-]{6,})',
        ]
        for pat in tn_patterns:
            m = re.search(pat, text, re.IGNORECASE | re.MULTILINE)
            if m:
                result['transaction_number'] = m.group(1)
                break

        # Also try extracting transaction number from the decoded subject line
        if 'transaction_number' not in result:
            sub_m = re.search(r'(?:transfer|transaction)\s+(\d{6,12})', subject, re.IGNORECASE)
            if sub_m:
                result['transaction_number'] = sub_m.group(1)

        amount_patterns = [
            (r'you\s+sent[:\s]+([A-Z]{3})\s*([\d,]+\.?\d*)', True),
            (r'amount\s+sent[:\s]+([A-Z]{3})\s*([\d,]+\.?\d*)', True),
            (r'\b(' + '|'.join(KNOWN_CURRENCIES) + r')\s+([\d,]+\.\d{2})\b', True),
            (r'([\d,]+\.\d{2})\s+(' + '|'.join(KNOWN_CURRENCIES) + r')\b', False),
        ]
        for pat, currency_first in amount_patterns:
            m = re.search(pat, text, re.IGNORECASE | re.MULTILINE)
            if m:
                g1, g2 = m.group(1), m.group(2)
                if currency_first:
                    result['currency'] = g1
                    result['amount'] = g2.replace(',', '')
                else:
                    result['amount'] = g1.replace(',', '')
                    result['currency'] = g2
                break

        return result

    def extract_transaction_data(
        self, content: str, formatted_date: str, sort_key: str,
        subject: str, recipient_name: str
    ) -> Optional[WorldRemitTransaction]:
        """Parse email content and return a transaction record."""
        try:
            soup = BeautifulSoup(content, 'html.parser')
            text = soup.get_text(separator='\n')

            data = self._parse_list_items(soup)

            if 'amount' not in data or 'transaction_number' not in data:
                fallback = self._parse_text_fallback(text, subject)
                for key in ('amount', 'currency', 'transaction_number'):
                    if key not in data and key in fallback:
                        data[key] = fallback[key]

            amount = data.get('amount', 'N/A')
            currency = data.get('currency', 'UGX')
            amount_eur = self._to_eur(amount, currency) if amount != 'N/A' else 'N/A'

            return WorldRemitTransaction(
                date=formatted_date,
                amount=amount,
                currency=currency,
                amount_eur=amount_eur,
                recipient_name=recipient_name,
                transaction_number=data.get('transaction_number', 'N/A'),
                email_subject=subject,
                sort_key=sort_key,
            )
        except Exception as e:
            print(f"  Error extracting transaction data: {e}")
            return None

    def search_worldremit_emails(self, recipient_name: str, start_year: int = 2021) -> List[bytes]:
        """Search inbox for WorldRemit emails mentioning the recipient."""
        try:
            self.imap_server.select('INBOX')
            search_string = (
                f'(FROM "worldremit" BODY "{recipient_name}" SINCE "01-Jan-{start_year}")'
            )
            print(f"Searching: {search_string}")
            status, message_ids = self.imap_server.search(None, search_string)
            if status != 'OK':
                print("Search failed.")
                return []
            email_ids = message_ids[0].split()
            print(f"Found {len(email_ids)} emails.")
            return email_ids
        except Exception as e:
            print(f"Error searching emails: {e}")
            return []

    def _upsert_transaction(self, new: WorldRemitTransaction) -> None:
        """
        Add a transaction, deduplicating by transaction number.
        When two emails share the same transaction number (e.g. "We're on it!" and
        "All done!"), keep the "All done" one — it has the most complete data.
        Transactions with no number (N/A) are always kept separately.
        """
        if new.transaction_number == 'N/A':
            self.transactions.append(new)
            return

        for idx, existing in enumerate(self.transactions):
            if existing.transaction_number == new.transaction_number:
                # Prefer the "All done" email; fall back to whichever has more data
                prefer_new = 'all done' in new.email_subject.lower() or (
                    existing.amount == 'N/A' and new.amount != 'N/A'
                )
                if prefer_new:
                    self.transactions[idx] = new
                    print(f"    → Merged duplicate TXN {new.transaction_number} (kept 'All done' email)")
                else:
                    print(f"    → Skipped duplicate TXN {new.transaction_number} (kept existing)")
                return

        self.transactions.append(new)

    def process_emails(self, recipient_name: str, start_year: int = 2021):
        """Fetch EUR rates then process all matching WorldRemit emails."""
        print("Fetching EUR exchange rates...")
        self.eur_rates = fetch_eur_rates()

        email_ids = self.search_worldremit_emails(recipient_name, start_year)
        if not email_ids:
            print("No emails found matching the criteria.")
            return

        print(f"Processing {len(email_ids)} emails...")

        for i, email_id in enumerate(email_ids):
            try:
                status, email_data = self.imap_server.fetch(email_id, '(RFC822)')
                if status != 'OK':
                    continue

                msg = email.message_from_bytes(email_data[0][1])
                subject = decode_mime_str(msg['Subject'])
                raw_date = msg['Date']

                # Use the RFC 2822 IMAP date header — always reliable and language-neutral
                try:
                    parsed_dt = dateutil_parser.parse(raw_date)
                    formatted_date = parsed_dt.strftime("%d %B %Y")   # "23 February 2024"
                    sort_key = parsed_dt.strftime("%Y-%m-%d")
                except Exception:
                    formatted_date = raw_date
                    sort_key = raw_date

                # Prefer HTML body; fall back to plain text
                content = ""
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == "text/html":
                            content = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                            break
                    if not content:
                        for part in msg.walk():
                            if part.get_content_type() == "text/plain":
                                content = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                                break
                else:
                    content = msg.get_payload(decode=True).decode('utf-8', errors='ignore')

                transaction = self.extract_transaction_data(
                    content, formatted_date, sort_key, subject, recipient_name
                )
                if transaction:
                    self._upsert_transaction(transaction)
                    print(
                        f"  [{i+1}/{len(email_ids)}] {formatted_date} | "
                        f"{transaction.amount} {transaction.currency} "
                        f"(≈{transaction.amount_eur} EUR) | "
                        f"TXN: {transaction.transaction_number}"
                    )

            except Exception as e:
                print(f"  Error processing email {i+1}: {e}")

        print(f"\nSuccessfully extracted {len(self.transactions)} transactions "
              f"({len(self.transactions)} unique).")

    def generate_pdf_report(
        self,
        output_file: str = "worldremit_transactions_report.pdf",
        recipient_name: str = "Patrick Kayombya",
        start_year: int = 2021,
    ):
        """Generate a professional PDF report for tax purposes."""
        try:
            doc = SimpleDocTemplate(output_file, pagesize=A4)
            story = []
            styles = getSampleStyleSheet()

            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=18,
                spaceAfter=30,
                alignment=TA_CENTER,
                textColor=colors.darkblue,
            )
            story.append(Paragraph("WorldRemit Transaction Report", title_style))

            info_style = ParagraphStyle(
                'InfoStyle',
                parent=styles['Normal'],
                fontSize=10,
                spaceAfter=20,
                alignment=TA_LEFT,
            )

            # Totals per currency and EUR grand total
            currency_totals: Dict[str, float] = {}
            eur_total = 0.0
            for t in self.transactions:
                if t.amount != 'N/A':
                    try:
                        currency_totals[t.currency] = currency_totals.get(t.currency, 0) + float(t.amount)
                    except ValueError:
                        pass
                if t.amount_eur != 'N/A':
                    try:
                        eur_total += float(t.amount_eur)
                    except ValueError:
                        pass

            rate_notes = []
            for cur in sorted(currency_totals):
                rate = self.eur_rates.get(cur, 0)
                if rate:
                    rate_notes.append(f"{cur}: 1 EUR ≈ {rate:.2f} {cur}")
            rate_note_str = "  |  ".join(rate_notes) if rate_notes else "N/A"

            info_text = (
                f"<b>Report Generated:</b> {datetime.now().strftime('%d %B %Y')}<br/>"
                f"<b>Total Transactions:</b> {len(self.transactions)}<br/>"
                f"<b>Recipient:</b> {recipient_name}<br/>"
                f"<b>Period:</b> {start_year} onwards<br/>"
                f"<b>Total EUR Equivalent:</b> {eur_total:,.2f} EUR<br/>"
                f"<i>Exchange rates used (approximate): {rate_note_str}</i>"
            )
            story.append(Paragraph(info_text, info_style))
            story.append(Spacer(1, 20))

            if not self.transactions:
                story.append(Paragraph("No transactions found.", styles['Normal']))
                doc.build(story)
                return

            # Table
            table_data = [['Date', 'Amount', 'Cur.', '≈ EUR', 'Transaction #', 'Email Subject']]
            for t in sorted(self.transactions, key=lambda x: x.sort_key):
                subj = t.email_subject if len(t.email_subject) <= 38 else t.email_subject[:35] + "..."
                table_data.append([
                    t.date,
                    t.amount,
                    t.currency,
                    t.amount_eur,
                    t.transaction_number[:15] if t.transaction_number != 'N/A' else 'N/A',
                    subj,
                ])

            col_widths = [1.35*inch, 0.9*inch, 0.5*inch, 0.75*inch, 1.2*inch, 2.3*inch]
            table = Table(table_data, colWidths=col_widths)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 7.5),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (1, 1), (3, -1), 'RIGHT'),   # amount columns right-aligned
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.Color(0.93, 0.95, 1.0)]),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            story.append(table)

            # Summary section
            story.append(Spacer(1, 30))
            summary_style = ParagraphStyle(
                'SummaryStyle', parent=styles['Normal'], fontSize=10, leftIndent=20
            )
            lines = ["<b>Summary by Currency:</b><br/>"]
            for cur, total in sorted(currency_totals.items()):
                rate = self.eur_rates.get(cur, 0)
                eur_eq = total / rate if rate > 0 else 0
                lines.append(f"{cur}: {total:,.2f}  (≈ {eur_eq:,.2f} EUR)<br/>")
            lines.append(f"<br/><b>Total EUR Equivalent: {eur_total:,.2f} EUR</b><br/>")
            lines.append(
                "<i>* EUR values are approximate based on current exchange rates "
                "and may differ from rates at the time of each transfer.</i>"
            )
            story.append(Paragraph("".join(lines), summary_style))

            doc.build(story)
            print(f"PDF report generated: {output_file}")

        except Exception as e:
            print(f"Error generating PDF: {e}")

    def save_json_backup(self, output_file: str = "worldremit_transactions.json"):
        """Save extracted data as JSON backup."""
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump([asdict(t) for t in self.transactions], f, indent=2, ensure_ascii=False)
            print(f"JSON backup saved: {output_file}")
        except Exception as e:
            print(f"Error saving JSON backup: {e}")

    def disconnect(self):
        """Close IMAP connection."""
        if self.imap_server:
            try:
                self.imap_server.close()
                self.imap_server.logout()
                print("Disconnected from email server.")
            except Exception:
                pass


def main():
    print("=" * 60)
    print("WorldRemit Transaction Extractor for Tax Reporting")
    print("=" * 60)

    email_address = input("Enter your email address: ").strip()
    password = getpass.getpass("Enter your App Password (not your regular password): ")

    recipient_name = input("Enter recipient name (default: Patrick Kayombya): ").strip()
    if not recipient_name:
        recipient_name = "Patrick Kayombya"

    start_year_input = input("Enter start year (default: 2021): ").strip()
    start_year = int(start_year_input) if start_year_input.isdigit() else 2021

    extractor = WorldRemitExtractor(email_address, password)

    try:
        if not extractor.connect_to_email():
            return

        print(f"\nSearching for WorldRemit emails for '{recipient_name}' from {start_year}...")
        extractor.process_emails(recipient_name, start_year)

        if extractor.transactions:
            print("\nGenerating reports...")
            extractor.generate_pdf_report(recipient_name=recipient_name, start_year=start_year)
            extractor.save_json_backup()
            print(f"\nDone.")
            print(f"  Transactions found : {len(extractor.transactions)}")
            print(f"  PDF report         : worldremit_transactions_report.pdf")
            print(f"  JSON backup        : worldremit_transactions.json")
        else:
            print("No transactions were found or extracted.")

    except KeyboardInterrupt:
        print("\nCancelled.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        extractor.disconnect()


if __name__ == "__main__":
    main()
