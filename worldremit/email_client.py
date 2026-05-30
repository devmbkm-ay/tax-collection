"""
IMAP email client — connect, search, fetch and deduplicate WorldRemit emails.
"""

import email
import imaplib
from typing import List, Optional, Tuple

from .models import WorldRemitTransaction
from .parser import decode_mime_str, parse_email_date, parse_transaction


def _imap_config(email_address: str) -> Tuple[str, str]:
    """Return (imap_host, provider_hint) for the given email address."""
    domain = email_address.split('@')[-1].lower()
    if 'gmail' in domain:
        return 'imap.gmail.com', (
            "1. Enable 2-Step Verification on your Google account\n"
            "2. Generate an App Password at myaccount.google.com/apppasswords\n"
            "3. Enable IMAP in Gmail Settings → Forwarding and POP/IMAP"
        )
    if any(x in domain for x in ('outlook', 'hotmail', 'live', 'msn')):
        return 'outlook.office365.com', (
            "1. Enable 2-factor authentication on your Microsoft account\n"
            "2. Generate an App Password at account.microsoft.com/security\n"
            "3. Enable IMAP in Outlook Settings"
        )
    return f'imap.{domain}', (
        "1. Check your email provider's IMAP settings\n"
        "2. Use an App Password"
    )


def _get_body(msg: email.message.Message) -> str:
    """Extract the best available body (HTML preferred, plain-text fallback)."""
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == 'text/html':
                return part.get_payload(decode=True).decode('utf-8', errors='ignore')
        for part in msg.walk():
            if part.get_content_type() == 'text/plain':
                return part.get_payload(decode=True).decode('utf-8', errors='ignore')
        return ''
    return msg.get_payload(decode=True).decode('utf-8', errors='ignore')


def _is_duplicate(new: WorldRemitTransaction, existing: WorldRemitTransaction) -> bool:
    if new.transaction_number != 'N/A' and existing.transaction_number != 'N/A':
        return new.transaction_number == existing.transaction_number
    return (
        new.sort_key == existing.sort_key
        and new.amount == existing.amount
        and new.currency == existing.currency
        and new.amount != 'N/A'
    )


def _prefer_new(new: WorldRemitTransaction, existing: WorldRemitTransaction) -> bool:
    if 'all done' in new.email_subject.lower():
        return True
    if 'all done' in existing.email_subject.lower():
        return False
    if new.transaction_number != 'N/A' and existing.transaction_number == 'N/A':
        return True
    return existing.amount == 'N/A' and new.amount != 'N/A'


class EmailClient:
    """Thin IMAP wrapper — connect, search, fetch, disconnect."""

    def __init__(self, email_address: str, password: str):
        self.email_address = email_address
        self.password = password
        self._imap: Optional[imaplib.IMAP4_SSL] = None

    # ------------------------------------------------------------------
    # Connection
    # ------------------------------------------------------------------

    def connect(self) -> bool:
        host, hint = _imap_config(self.email_address)
        try:
            print(f"Connecting to {host}...")
            self._imap = imaplib.IMAP4_SSL(host, 993)
            self._imap.login(self.email_address, self.password)
            print("Connected successfully.")
            return True
        except imaplib.IMAP4.error as e:
            print(f"IMAP login failed: {e}\n\nTroubleshooting:\n{hint}")
            return False
        except Exception as e:
            print(f"Connection error: {e}")
            return False

    def disconnect(self) -> None:
        if self._imap:
            try:
                self._imap.close()
                self._imap.logout()
                print("Disconnected.")
            except Exception:
                pass

    # ------------------------------------------------------------------
    # Search & fetch
    # ------------------------------------------------------------------

    def search(self, recipient_name: Optional[str], start_year: int, end_year: int) -> List[bytes]:
        """Return IMAP message IDs matching the WorldRemit + date criteria.
        When recipient_name is provided it is added as a BODY filter for speed."""
        try:
            self._imap.select('INBOX')
            body_filter = f'BODY "{recipient_name}" ' if recipient_name else ''
            criteria = (
                f'(FROM "worldremit" {body_filter}'
                f'SINCE "01-Jan-{start_year}" BEFORE "01-Jan-{end_year + 1}")'
            )
            print(f"Searching: {criteria}")
            status, data = self._imap.search(None, criteria)
            if status != 'OK':
                print("Search failed.")
                return []
            ids = data[0].split()
            print(f"Found {len(ids)} emails.")
            return ids
        except Exception as e:
            print(f"Search error: {e}")
            return []

    def fetch_message(self, email_id: bytes) -> Optional[email.message.Message]:
        """Fetch and parse a single email message."""
        try:
            status, data = self._imap.fetch(email_id, '(RFC822)')
            if status == 'OK':
                return email.message_from_bytes(data[0][1])
        except Exception:
            pass
        return None

    # ------------------------------------------------------------------
    # High-level processing
    # ------------------------------------------------------------------

    def fetch_transactions(
        self,
        recipient_names: List[Optional[str]],
        start_year: int,
        end_year: int,
        eur_rates: dict,
    ) -> List[WorldRemitTransaction]:
        """
        Search, fetch and deduplicate all WorldRemit transactions for one or
        more recipients. Runs a separate IMAP search per name and merges results.
        """
        # Collect unique email IDs across all recipient queries
        all_ids: List[bytes] = []
        seen_ids: set = set()
        for name in recipient_names:
            for eid in self.search(name, start_year, end_year):
                if eid not in seen_ids:
                    seen_ids.add(eid)
                    all_ids.append(eid)

        if not all_ids:
            return []

        transactions: List[WorldRemitTransaction] = []
        print(f"Processing {len(all_ids)} emails...")

        for i, email_id in enumerate(all_ids):
            msg = self.fetch_message(email_id)
            if not msg:
                continue

            subject  = decode_mime_str(msg['Subject'])
            raw_date = msg['Date']

            try:
                formatted_date, sort_key, year = parse_email_date(raw_date)
                if not (start_year <= year <= end_year):
                    continue
            except Exception:
                formatted_date, sort_key = raw_date, raw_date

            # Pass None so the parser auto-detects the name from content
            txn = parse_transaction(
                _get_body(msg), formatted_date, sort_key,
                subject, None, eur_rates,
            )
            if txn:
                _upsert(transactions, txn)
                print(
                    f"  [{i+1}/{len(all_ids)}] {formatted_date} | "
                    f"{txn.amount} {txn.currency} (≈{txn.amount_eur} EUR) | "
                    f"{txn.recipient_name} | TXN: {txn.transaction_number}"
                )

        print(f"\n{len(transactions)} unique transactions extracted.")
        return transactions


def _upsert(transactions: List[WorldRemitTransaction], new: WorldRemitTransaction) -> None:
    """Insert or merge a transaction into the list, deduplicating intelligently."""
    for idx, existing in enumerate(transactions):
        if _is_duplicate(new, existing):
            if _prefer_new(new, existing):
                if new.transaction_number == 'N/A' and existing.transaction_number != 'N/A':
                    new = WorldRemitTransaction(
                        **{**new.__dict__, 'transaction_number': existing.transaction_number}
                    )
                transactions[idx] = new
                print(f"    → Merged duplicate ({new.sort_key} {new.amount} {new.currency}) — kept TXN {new.transaction_number}")
            else:
                if existing.transaction_number == 'N/A' and new.transaction_number != 'N/A':
                    transactions[idx] = WorldRemitTransaction(
                        **{**existing.__dict__, 'transaction_number': new.transaction_number}
                    )
                print(f"    → Skipped duplicate — kept TXN {transactions[idx].transaction_number}")
            return
    transactions.append(new)
