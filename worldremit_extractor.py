#!/usr/bin/env python3
"""
WorldRemit Email Transaction Extractor
Extracts WorldRemit transaction data from emails and generates PDF reports for tax purposes.
"""

import imaplib
import email
import re
import json
from datetime import datetime, date
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
import getpass
import sys
from pathlib import Path

from bs4 import BeautifulSoup
from dateutil import parser
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


@dataclass
class WorldRemitTransaction:
    """Data structure for WorldRemit transaction information."""
    date: str
    amount: str
    currency: str
    recipient_name: str
    recipient_details: str
    transaction_number: str
    sender_name: str
    email_subject: str
    raw_email_date: str


class WorldRemitExtractor:
    """Extract WorldRemit transactions from email and generate PDF reports."""
    
    def __init__(self, email_address: str, password: str):
        self.email_address = email_address
        self.password = password
        self.transactions: List[WorldRemitTransaction] = []
        self.imap_server = None
        
    def connect_to_email(self) -> bool:
        """Connect to email server using IMAP."""
        try:
            # Outlook/Hotmail IMAP settings
            # imap_host = 'outlook.office365.com'
            imap_host = 'imap.gmail.com'  # For testing with Gmail, change to 'outlook.office365.com' for actual use
            imap_port = 993
            
            print(f"Connecting to {imap_host}...")
            self.imap_server = imaplib.IMAP4_SSL(imap_host, imap_port)
            self.imap_server.login(self.email_address, self.password)
            print("Successfully connected to email server.")
            return True
            
        except imaplib.IMAP4.error as e:
            print(f"IMAP login failed: {e}")
            print("\nTroubleshooting tips:")
            print("1. Make sure you're using an App Password (not your regular password)")
            print("2. Enable 2-factor authentication and generate an App Password")
            print("3. Check if IMAP is enabled in your Outlook settings")
            return False
        except Exception as e:
            print(f"Connection error: {e}")
            return False
    
    def search_worldremit_emails(self, recipient_name: str, start_year: int = "") -> List[bytes]:
        """Search for WorldRemit emails containing the recipient name."""
        try:
            self.imap_server.select('INBOX')
            
            # Search for emails from WorldRemit
            search_criteria = [
                'FROM "worldremit"',
                f'BODY "{recipient_name}"',
                f'SINCE "01-Jan-{start_year}"'
            ]
            
            search_string = f'({" ".join(search_criteria)})'
            print(f"Searching with criteria: {search_string}")
            
            status, message_ids = self.imap_server.search(None, search_string)
            
            if status != 'OK':
                print("Failed to search emails")
                return []
                
            email_ids = message_ids[0].split()
            print(f"Found {len(email_ids)} emails matching criteria")
            return email_ids
            
        except Exception as e:
            print(f"Error searching emails: {e}")
            return []
    
    def extract_transaction_data(self, email_content: str, email_date: str, subject: str) -> Optional[WorldRemitTransaction]:
        """Extract transaction data from email content."""
        try:
            # Parse HTML content
            soup = BeautifulSoup(email_content, 'html.parser')
            text_content = soup.get_text()
            
            # Patterns to extract information
            patterns = {
                'amount': [
                    r'Amount sent[:\s]+([A-Z]{3}\s*[\d,]+\.?\d*)',
                    r'You sent[:\s]+([A-Z]{3}\s*[\d,]+\.?\d*)',
                    r'Total[:\s]+([A-Z]{3}\s*[\d,]+\.?\d*)',
                    r'([A-Z]{3}\s*[\d,]+\.?\d*)\s*sent',
                ],
                'recipient_name': [
                    r'Recipient[:\s]+([^\n\r]+)',
                    r'To[:\s]+([A-Z][a-zA-Z\s]+)',
                    r'Sending to[:\s]+([^\n\r]+)',
                ],
                'transaction_number': [
                    r'Transaction (?:number|ID|ref)[:\s]*([A-Z0-9-]+)',
                    r'Reference[:\s]*([A-Z0-9-]+)',
                    r'MTCN[:\s]*([A-Z0-9-]+)',
                ],
                'date': [
                    r'Date[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
                    r'Sent on[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
                    r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})',
                ]
            }
            
            extracted_data = {}
            
            # Extract using patterns
            for field, pattern_list in patterns.items():
                for pattern in pattern_list:
                    match = re.search(pattern, text_content, re.IGNORECASE | re.MULTILINE)
                    if match:
                        extracted_data[field] = match.group(1).strip()
                        break
            
            # Parse currency and amount
            amount_str = extracted_data.get('amount', '')
            currency_match = re.match(r'([A-Z]{3})', amount_str)
            currency = currency_match.group(1) if currency_match else 'USD'
            amount_clean = re.sub(r'[A-Z]{3}\s*', '', amount_str).replace(',', '')
            
            transaction = WorldRemitTransaction(
                date=extracted_data.get('date', email_date),
                amount=amount_clean or 'N/A',
                currency=currency,
                recipient_name=extracted_data.get('recipient_name', 'Marie Thérèse Clarisse'),
                recipient_details=f"Recipient: {extracted_data.get('recipient_name', 'Marie Thérèse Clarisse')}",
                transaction_number=extracted_data.get('transaction_number', 'N/A'),
                sender_name=self.email_address,
                email_subject=subject,
                raw_email_date=email_date
            )
            
            return transaction
            
        except Exception as e:
            print(f"Error extracting transaction data: {e}")
            return None
    
    def process_emails(self, recipient_name: str, start_year: int = 2021):
        """Process all WorldRemit emails and extract transaction data."""
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
                
                raw_email = email_data[0][1]
                email_message = email.message_from_bytes(raw_email)
                
                subject = email_message['Subject']
                email_date = email_message['Date']
                
                # Get email content
                content = ""
                if email_message.is_multipart():
                    for part in email_message.walk():
                        if part.get_content_type() == "text/html":
                            content = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                            break
                        elif part.get_content_type() == "text/plain" and not content:
                            content = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                else:
                    content = email_message.get_payload(decode=True).decode('utf-8', errors='ignore')
                
                # Extract transaction data
                transaction = self.extract_transaction_data(content, email_date, subject)
                if transaction:
                    self.transactions.append(transaction)
                    print(f"Processed email {i+1}/{len(email_ids)}: {transaction.transaction_number}")
                
            except Exception as e:
                print(f"Error processing email {i+1}: {e}")
                continue
        
        print(f"Successfully extracted {len(self.transactions)} transactions")
    
    def generate_pdf_report(self, output_file: str = "worldremit_transactions_report.pdf"):
        """Generate a professional PDF report for tax purposes."""
        try:
            doc = SimpleDocTemplate(output_file, pagesize=A4)
            story = []
            styles = getSampleStyleSheet()
            
            # Title
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=18,
                spaceAfter=30,
                alignment=TA_CENTER,
                textColor=colors.darkblue
            )
            
            title = Paragraph("WorldRemit Transaction Report", title_style)
            story.append(title)
            
            # Report info
            info_style = ParagraphStyle(
                'InfoStyle',
                parent=styles['Normal'],
                fontSize=10,
                spaceAfter=20,
                alignment=TA_LEFT
            )
            
            report_date = datetime.now().strftime("%B %d, %Y")
            total_transactions = len(self.transactions)
            total_amount = sum(float(t.amount) for t in self.transactions if t.amount != 'N/A' and t.amount.replace('.', '').isdigit())
            
            info_text = f"""
            <b>Report Generated:</b> {report_date}<br/>
            <b>Total Transactions:</b> {total_transactions}<br/>
            <b>Recipient:</b> Marie Thérèse Clarisse<br/>
            <b>Period:</b> 2021 onwards<br/>
            <b>Total Amount:</b> {total_amount:.2f} (mixed currencies)<br/>
            """
            
            info_para = Paragraph(info_text, info_style)
            story.append(info_para)
            story.append(Spacer(1, 20))
            
            if not self.transactions:
                no_data = Paragraph("No transactions found matching the criteria.", styles['Normal'])
                story.append(no_data)
                doc.build(story)
                return
            
            # Table data
            table_data = [
                ['Date', 'Amount', 'Currency', 'Transaction #', 'Recipient', 'Email Subject']
            ]
            
            for transaction in sorted(self.transactions, key=lambda x: x.raw_email_date):
                # Format date
                try:
                    parsed_date = parser.parse(transaction.date)
                    formatted_date = parsed_date.strftime("%Y-%m-%d")
                except:
                    formatted_date = transaction.date[:10] if transaction.date else "N/A"
                
                # Truncate long subjects
                subject = transaction.email_subject[:40] + "..." if len(transaction.email_subject) > 40 else transaction.email_subject
                
                table_data.append([
                    formatted_date,
                    transaction.amount,
                    transaction.currency,
                    transaction.transaction_number[:15] if transaction.transaction_number else "N/A",
                    transaction.recipient_name[:25] if transaction.recipient_name else "N/A",
                    subject
                ])
            
            # Create table
            table = Table(table_data, colWidths=[1.2*inch, 0.8*inch, 0.6*inch, 1.2*inch, 1.5*inch, 2*inch])
            table.setStyle(TableStyle([
                # Header style
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                
                # Data rows
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
                ('ALIGN', (1, 1), (1, -1), 'RIGHT'),  # Amount column right-aligned
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            
            story.append(table)
            
            # Summary
            story.append(Spacer(1, 30))
            summary_style = ParagraphStyle(
                'SummaryStyle',
                parent=styles['Normal'],
                fontSize=10,
                alignment=TA_LEFT,
                leftIndent=20
            )
            
            currency_totals = {}
            for transaction in self.transactions:
                if transaction.amount != 'N/A' and transaction.amount.replace('.', '').isdigit():
                    currency = transaction.currency
                    amount = float(transaction.amount)
                    currency_totals[currency] = currency_totals.get(currency, 0) + amount
            
            summary_text = "<b>Summary by Currency:</b><br/>"
            for currency, total in currency_totals.items():
                summary_text += f"{currency}: {total:.2f}<br/>"
            
            summary_para = Paragraph(summary_text, summary_style)
            story.append(summary_para)
            
            doc.build(story)
            print(f"PDF report generated successfully: {output_file}")
            
        except Exception as e:
            print(f"Error generating PDF: {e}")
    
    def save_json_backup(self, output_file: str = "worldremit_transactions.json"):
        """Save extracted data as JSON backup."""
        try:
            data = [asdict(transaction) for transaction in self.transactions]
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"JSON backup saved: {output_file}")
        except Exception as e:
            print(f"Error saving JSON backup: {e}")
    
    def disconnect(self):
        """Close email connection."""
        if self.imap_server:
            try:
                self.imap_server.close()
                self.imap_server.logout()
                print("Disconnected from email server.")
            except:
                pass


def main():
    """Main function to run the WorldRemit extractor."""
    print("=" * 60)
    print("WorldRemit Transaction Extractor for Tax Reporting")
    print("=" * 60)
    
    # Get email credentials
    email_address = input("Enter your Outlook/Hotmail email address: ").strip()
    password = getpass.getpass("Enter your App Password (not your regular password): ")
    
    # Get search parameters
    recipient_name = input("Enter recipient name (default: Marie Thérèse Clarisse): ").strip()
    if not recipient_name:
        recipient_name = "Marie Thérèse Clarisse"
    
    start_year_input = input("Enter start year (default: 2021): ").strip()
    start_year = int(start_year_input) if start_year_input.isdigit() else 2021
    
    # Create extractor instance
    extractor = WorldRemitExtractor(email_address, password)
    
    try:
        # Connect and process
        if not extractor.connect_to_email():
            return
        
        print(f"\nSearching for WorldRemit emails for '{recipient_name}' from {start_year}...")
        extractor.process_emails(recipient_name, start_year)
        
        if extractor.transactions:
            # Generate reports
            print("\nGenerating reports...")
            extractor.generate_pdf_report()
            extractor.save_json_backup()
            
            print(f"\nReport Summary:")
            print(f"- Total transactions found: {len(extractor.transactions)}")
            print(f"- PDF report: worldremit_transactions_report.pdf")
            print(f"- JSON backup: worldremit_transactions.json")
        else:
            print("No transactions were found or extracted.")
    
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        extractor.disconnect()


if __name__ == "__main__":
    main()
