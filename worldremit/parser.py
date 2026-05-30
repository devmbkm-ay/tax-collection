"""
Email content parsing — extracts transaction fields from WorldRemit HTML emails.
"""

import re
from email.header import decode_header as _decode_header
from typing import Dict, Optional

from bs4 import BeautifulSoup
from dateutil import parser as dateutil_parser

from .models import KNOWN_CURRENCIES, CURRENCY_COUNTRY, WorldRemitTransaction
from .exchange import to_eur


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


def parse_email_date(raw_date: str) -> tuple[str, str]:
    """
    Parse an RFC 2822 email date header.
    Returns (formatted_date, sort_key) e.g. ("23 February 2024", "2024-02-23").
    Falls back to the raw string on failure.
    """
    try:
        dt = dateutil_parser.parse(raw_date)
        return dt.strftime("%d %B %Y"), dt.strftime("%Y-%m-%d"), dt.year
    except Exception:
        return raw_date, raw_date, 0


def _parse_list_items(soup: BeautifulSoup) -> Dict:
    """
    Parse <li> bullet items to extract transaction fields.
    Handles two WorldRemit email formats:
      - "We're on it" checklist: transaction number / bare amount / bare currency / recipient
      - "All done"  detail list: "You sent: UGX X.XX to Uganda"
    """
    result: Dict = {}
    items = [li.get_text(strip=True) for li in soup.find_all('li')]

    for i, item in enumerate(items):
        # Transaction number
        tn = re.search(
            r'(?:your\s+)?(?:worldremit\s+)?(?:transfer|transaction)\s+(?:number|ID|ref)[:\s]*(\d{6,12})',
            item, re.IGNORECASE,
        )
        if tn and 'transaction_number' not in result:
            result['transaction_number'] = tn.group(1)

        # "You sent: UGX 206247.00 to Uganda"
        sent = re.search(
            r'you\s+sent[:\s]+([A-Z]{3})\s*([\d,]+\.?\d*)\s+to\s+([A-Za-z\s]+?)(?:\s*$|\s*\.)',
            item, re.IGNORECASE,
        )
        if sent and 'amount' not in result:
            result['currency'] = sent.group(1)
            result['amount']   = sent.group(2).replace(',', '')
            result['country']  = sent.group(3).strip().title()

        # Inline "UGX 206247.00"
        if 'amount' not in result:
            m = re.search(r'\b(' + '|'.join(KNOWN_CURRENCIES) + r')\s+([\d,]+\.\d{2})\b', item)
            if m:
                result['currency'] = m.group(1)
                result['amount']   = m.group(2).replace(',', '')

        # Inline "206247.00 UGX"
        if 'amount' not in result:
            m = re.search(r'([\d,]+\.\d{2})\s+(' + '|'.join(KNOWN_CURRENCIES) + r')\b', item)
            if m:
                result['amount']   = m.group(1).replace(',', '')
                result['currency'] = m.group(2)

        # Bare decimal on its own bullet ("1162918.00")
        if 'amount' not in result and re.match(r'^[\d,]+\.\d{1,2}$', item.strip()):
            result['amount'] = item.strip().replace(',', '')
            if i + 1 < len(items) and items[i + 1].strip() in KNOWN_CURRENCIES:
                result['currency'] = items[i + 1].strip()

    return result


def _parse_text_fallback(text: str, subject: str) -> Dict:
    """Text-based fallback when HTML list parsing is incomplete."""
    result: Dict = {}

    for pat in [
        r'(?:your\s+)?(?:worldremit\s+)?(?:transfer|transaction)\s+(?:number|ID|ref)[:\s]*(\d{6,12})',
        r'(?:transfer|transaction)\s+(\d{6,12})\s+has been',
        r'Reference[:\s]*([A-Z0-9-]{6,})',
    ]:
        m = re.search(pat, text, re.IGNORECASE | re.MULTILINE)
        if m:
            result['transaction_number'] = m.group(1)
            break

    if 'transaction_number' not in result:
        m = re.search(r'(?:transfer|transaction)\s+(\d{6,12})', subject, re.IGNORECASE)
        if m:
            result['transaction_number'] = m.group(1)

    for pat, currency_first in [
        (r'you\s+sent[:\s]+([A-Z]{3})\s*([\d,]+\.?\d*)', True),
        (r'amount\s+sent[:\s]+([A-Z]{3})\s*([\d,]+\.?\d*)', True),
        (r'\b(' + '|'.join(KNOWN_CURRENCIES) + r')\s+([\d,]+\.\d{2})\b', True),
        (r'([\d,]+\.\d{2})\s+(' + '|'.join(KNOWN_CURRENCIES) + r')\b', False),
    ]:
        m = re.search(pat, text, re.IGNORECASE | re.MULTILINE)
        if m:
            g1, g2 = m.group(1), m.group(2)
            if currency_first:
                result['currency'], result['amount'] = g1, g2.replace(',', '')
            else:
                result['amount'], result['currency'] = g1.replace(',', ''), g2
            break

    return result


_NAME_BLACKLIST = frozenset({
    'mobile', 'money', 'account', 'number', 'local', 'partner', 'added',
    'collection', 'payment', 'service', 'your', 'our', 'their', 'the',
    'bank', 'provider', 'card', 'wallet', 'transfer', 'sent', 'received',
    'great', 'done', 'next', 'time', 'to', 'from', 'with',
})


def _is_likely_name(name: str) -> bool:
    words = name.lower().split()
    return len(words) >= 2 and not any(w in _NAME_BLACKLIST for w in words)


def _extract_recipient_name(text: str, subject: str) -> str:
    """
    Extract the recipient's real name from WorldRemit email body or subject.
    Patterns are case-sensitive — real names appear in Title Case in these emails.
    Running with IGNORECASE would match generic phrases like 'their mobile money
    account' and produce false positives such as 'Their Mobile Money Account'.
    """
    patterns = [
        # "Patrick Kayombya has received your transfer" — most reliable ("All done" emails)
        r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+has\s+received\s+your',
        # "Patrick Kayombya will receive your transfer" — ("We're on it" emails)
        r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+will\s+receive\s+your',
        # "for you: Patrick Kayombya has received"
        r'for\s+you[,:]?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+has',
        # "Recipient: Patrick Kayombya" — explicit label
        r'Recipient[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)',
    ]
    for src in (subject, text):
        for pat in patterns:
            m = re.search(pat, src)  # no IGNORECASE — enforces Title Case
            if m:
                name = m.group(1).strip()
                if _is_likely_name(name):
                    return name
    return ""


def parse_transaction(
    content: str,
    formatted_date: str,
    sort_key: str,
    subject: str,
    recipient_name: Optional[str],
    eur_rates: Dict[str, float],
) -> Optional[WorldRemitTransaction]:
    """
    Parse email HTML/text content and return a WorldRemitTransaction.
    Returns None if parsing fails entirely.
    """
    try:
        soup = BeautifulSoup(content, 'html.parser')
        text = soup.get_text(separator='\n')

        data = _parse_list_items(soup)

        if 'amount' not in data or 'transaction_number' not in data:
            fallback = _parse_text_fallback(text, subject)
            for key in ('amount', 'currency', 'transaction_number'):
                if key not in data and key in fallback:
                    data[key] = fallback[key]

        amount   = data.get('amount', 'N/A')
        currency = data.get('currency', 'UGX')

        resolved_name = recipient_name or _extract_recipient_name(text, subject)

        return WorldRemitTransaction(
            date=formatted_date,
            amount=amount,
            currency=currency,
            amount_eur=to_eur(amount, currency, eur_rates) if amount != 'N/A' else 'N/A',
            recipient_name=resolved_name,
            transaction_number=data.get('transaction_number', 'N/A'),
            email_subject=subject,
            country=data.get('country') or CURRENCY_COUNTRY.get(currency, ''),
            sort_key=sort_key,
        )
    except Exception as e:
        print(f"  Error parsing transaction: {e}")
        return None
