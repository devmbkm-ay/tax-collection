"""
Backward-compatible entry point.
All logic now lives in the worldremit/ package.
"""

from worldremit import WorldRemitExtractor
from worldremit.cli import main
from worldremit.models import WorldRemitTransaction, TRANSLATIONS, CURRENCY_COUNTRY, KNOWN_CURRENCIES
from worldremit.exchange import fetch_eur_rates
from worldremit.parser import decode_mime_str, parse_transaction
from worldremit.report import generate_pdf_report, save_json_backup

__all__ = [
    'WorldRemitExtractor',
    'WorldRemitTransaction',
    'TRANSLATIONS',
    'CURRENCY_COUNTRY',
    'KNOWN_CURRENCIES',
    'fetch_eur_rates',
    'decode_mime_str',
    'parse_transaction',
    'generate_pdf_report',
    'save_json_backup',
    'main',
]

if __name__ == "__main__":
    main()
