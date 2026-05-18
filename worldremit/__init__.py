"""
worldremit — public API surface.

Usage:
    from worldremit import WorldRemitExtractor
"""

from typing import Dict, List

from .email_client import EmailClient
from .exchange import fetch_eur_rates
from .models import WorldRemitTransaction
from .report import generate_pdf_report, save_json_backup

__all__ = ['WorldRemitExtractor']


class WorldRemitExtractor:
    """
    Orchestrator — the single entry point for external code and the CLI.
    Delegates to EmailClient, exchange, parser and report modules.
    """

    def __init__(self, email_address: str, password: str):
        self.email_address = email_address
        self._client = EmailClient(email_address, password)
        self.transactions: List[WorldRemitTransaction] = []
        self.eur_rates: Dict[str, float] = {}

    # ── Connection ─────────────────────────────────────────────────────

    def connect_to_email(self) -> bool:
        return self._client.connect()

    def disconnect(self) -> None:
        self._client.disconnect()

    # ── Processing ─────────────────────────────────────────────────────

    def process_emails(self, recipient_name: str, start_year: int, end_year: int) -> None:
        print("Fetching EUR exchange rates...")
        self.eur_rates = fetch_eur_rates()
        self.transactions = self._client.fetch_transactions(
            recipient_name, start_year, end_year, self.eur_rates
        )

    # ── Output ─────────────────────────────────────────────────────────

    def generate_pdf_report(
        self,
        output_file: str = "worldremit_transactions_report.pdf",
        recipient_name: str = "Patrick Kayombya",
        start_year: int = 2023,
        end_year: int = 2023,
        lang: str = 'fr',
    ) -> str:
        return generate_pdf_report(
            self.transactions, self.eur_rates,
            output_file=output_file,
            recipient_name=recipient_name,
            start_year=start_year,
            end_year=end_year,
            lang=lang,
        )

    def save_json_backup(self, output_file: str = "worldremit_transactions.json") -> str:
        return save_json_backup(self.transactions, output_file)
