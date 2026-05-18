"""
Command-line interface for the WorldRemit transaction extractor.
"""

import getpass
import re
from datetime import datetime

from . import WorldRemitExtractor


def main() -> None:
    print("=" * 60)
    print("WorldRemit Transaction Extractor for Tax Reporting")
    print("=" * 60)

    email_address = input("Enter your email address: ").strip()
    password      = getpass.getpass("Enter your App Password (not your regular password): ")

    recipient_name = input("Enter recipient name (default: Patrick Kayombya): ").strip()
    if not recipient_name:
        recipient_name = "Patrick Kayombya"

    print("\nPeriod / Période:")
    print("  Single year  → e.g. 2023")
    print("  Year range   → e.g. 2023-2024")
    year_input = input("Year(s) [default: 2023]: ").strip() or "2023"

    current_year = datetime.now().year
    if re.match(r'^\d{4}-\d{4}$', year_input):
        start_year, end_year = map(int, year_input.split('-'))
    elif re.match(r'^\d{4}$', year_input):
        start_year = end_year = int(year_input)
    else:
        print("Invalid format — defaulting to 2023.")
        start_year = end_year = 2023

    if start_year > end_year:
        start_year, end_year = end_year, start_year
    end_year = min(end_year, current_year)

    lang_input = input("\nReport language / Langue du rapport (fr/en) [default: fr]: ").strip().lower()
    lang = lang_input if lang_input in ('fr', 'en') else 'fr'

    extractor = WorldRemitExtractor(email_address, password)

    try:
        if not extractor.connect_to_email():
            return

        period_display = str(start_year) if start_year == end_year else f"{start_year}-{end_year}"
        print(f"\nSearching WorldRemit emails for '{recipient_name}' — period: {period_display}...")
        extractor.process_emails(recipient_name, start_year, end_year)

        if extractor.transactions:
            print("\nGenerating reports...")
            extractor.generate_pdf_report(
                recipient_name=recipient_name,
                start_year=start_year,
                end_year=end_year,
                lang=lang,
            )
            extractor.save_json_backup()
            print(f"\nDone.")
            print(f"  Transactions : {len(extractor.transactions)}")
            print(f"  PDF report   : worldremit_transactions_report.pdf")
            print(f"  JSON backup  : worldremit_transactions.json")
        else:
            print("No transactions found.")

    except KeyboardInterrupt:
        print("\nCancelled.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        extractor.disconnect()


if __name__ == "__main__":
    main()
