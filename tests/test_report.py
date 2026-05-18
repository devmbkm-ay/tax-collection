"""
Tests for worldremit/report.py — PDF generation and JSON backup.
"""

import json
import tempfile
from pathlib import Path

import pytest
from worldremit.models import WorldRemitTransaction
from worldremit.report import generate_pdf_report, save_json_backup

RATES = {'UGX': 4100.0, 'USD': 1.08, 'EUR': 1.0}


def make_txn(**kwargs) -> WorldRemitTransaction:
    defaults = dict(
        date="23 February 2024",
        amount="206247.00",
        currency="UGX",
        amount_eur="50.30",
        recipient_name="Patrick Kayombya",
        transaction_number="189895874",
        email_subject="All done!",
        country="Uganda",
        sort_key="2024-02-23",
    )
    defaults.update(kwargs)
    return WorldRemitTransaction(**defaults)


# ── PDF generation ────────────────────────────────────────────────────────────

class TestGeneratePdfReport:
    def test_creates_file(self):
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            path = f.name
        generate_pdf_report([make_txn()], RATES, output_file=path)
        assert Path(path).exists()
        assert Path(path).stat().st_size > 0

    def test_empty_transactions_still_creates_file(self):
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            path = f.name
        generate_pdf_report([], RATES, output_file=path)
        assert Path(path).exists()

    def test_french_language(self):
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            path = f.name
        result = generate_pdf_report(
            [make_txn()], RATES, output_file=path,
            lang='fr', start_year=2024, end_year=2024,
        )
        assert result == path

    def test_english_language(self):
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            path = f.name
        generate_pdf_report(
            [make_txn()], RATES, output_file=path,
            lang='en', start_year=2024, end_year=2024,
        )
        assert Path(path).stat().st_size > 0

    def test_multiple_transactions(self):
        txns = [
            make_txn(transaction_number="111", sort_key="2023-01-01", amount="100.00"),
            make_txn(transaction_number="222", sort_key="2023-06-15", amount="200.00"),
            make_txn(transaction_number="333", sort_key="2023-12-31", amount="300.00"),
        ]
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            path = f.name
        generate_pdf_report(txns, RATES, output_file=path)
        assert Path(path).stat().st_size > 0

    def test_year_range_in_report(self):
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            path = f.name
        # Should not raise for multi-year range
        generate_pdf_report(
            [make_txn()], RATES, output_file=path,
            start_year=2021, end_year=2024,
        )
        assert Path(path).exists()


# ── JSON backup ───────────────────────────────────────────────────────────────

class TestSaveJsonBackup:
    def test_creates_valid_json(self):
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False, mode='w') as f:
            path = f.name
        save_json_backup([make_txn()], path)
        data = json.loads(Path(path).read_text())
        assert isinstance(data, list)
        assert len(data) == 1

    def test_fields_preserved(self):
        txn = make_txn(transaction_number="189895874", amount="206247.00")
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False, mode='w') as f:
            path = f.name
        save_json_backup([txn], path)
        data = json.loads(Path(path).read_text())
        assert data[0]["transaction_number"] == "189895874"
        assert data[0]["amount"] == "206247.00"
        assert data[0]["country"] == "Uganda"

    def test_empty_list_creates_empty_array(self):
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False, mode='w') as f:
            path = f.name
        save_json_backup([], path)
        data = json.loads(Path(path).read_text())
        assert data == []

    def test_utf8_characters_preserved(self):
        txn = make_txn(country="Côte d'Ivoire", recipient_name="André Dupont")
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False, mode='w') as f:
            path = f.name
        save_json_backup([txn], path)
        raw = Path(path).read_text(encoding='utf-8')
        assert "Côte" in raw
        assert "André" in raw
