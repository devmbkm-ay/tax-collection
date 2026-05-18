"""
Tests for worldremit/parser.py

Covers both WorldRemit email formats, edge cases, MIME decoding and date parsing.
"""

import pytest
from worldremit.parser import (
    decode_mime_str,
    parse_email_date,
    parse_transaction,
)

RATES = {'UGX': 4100.0, 'USD': 1.08, 'EUR': 1.0, 'GBP': 0.86}

# ── Fixtures: realistic email HTML ───────────────────────────────────────────

ALL_DONE_HTML = """
<ul>
  <li>Your WorldRemit transfer number: 189895874</li>
  <li>You sent: UGX 206247.00 to Uganda</li>
  <li>Mobile money provider: Airtel Uganda</li>
  <li>Mobile money account number: 704507171</li>
</ul>
"""

CHECKLIST_HTML = """
<ul>
  <li>Your transaction number: 180799565</li>
  <li>1162918.00</li>
  <li>UGX</li>
  <li>Patrick Kayombya</li>
</ul>
"""

EUR_TRANSFER_HTML = """
<ul>
  <li>Your WorldRemit transfer number: 106669342</li>
  <li>You sent: EUR 30.99 to Europe</li>
</ul>
"""

MISSING_TXN_HTML = """
<ul>
  <li>You sent: UGX 80634.00 to Uganda</li>
</ul>
"""

MISSING_AMOUNT_HTML = """
<ul>
  <li>Your transaction number: 184356277</li>
  <li>Patrick Kayombya</li>
</ul>
"""


# ── decode_mime_str ───────────────────────────────────────────────────────────

class TestDecodeMimeStr:
    def test_base64_encoded(self):
        # "We're on it! 180795"
        raw = "=?UTF-8?B?V2XigJlyZSBvbiBpdCEgMTgwNzk1?="
        result = decode_mime_str(raw)
        assert "on it" in result

    def test_plain_string_unchanged(self):
        assert decode_mime_str("All done!") == "All done!"

    def test_empty_returns_empty(self):
        assert decode_mime_str("") == ""
        assert decode_mime_str(None) == ""

    def test_mixed_encoded_and_plain(self):
        raw = "=?utf-8?B?SGVsbG8=?= World"
        result = decode_mime_str(raw)
        assert "Hello" in result
        assert "World" in result


# ── parse_email_date ──────────────────────────────────────────────────────────

class TestParseEmailDate:
    def test_rfc2822_standard(self):
        formatted, sort_key, year = parse_email_date("Fri, 23 Feb 2024 12:13:00 +0000")
        assert formatted == "23 February 2024"
        assert sort_key == "2024-02-23"
        assert year == 2024

    def test_returns_three_values(self):
        result = parse_email_date("Mon, 16 May 2023 09:00:00 +0000")
        assert len(result) == 3

    def test_fallback_on_invalid(self):
        formatted, sort_key, year = parse_email_date("not a date")
        assert formatted == "not a date"
        assert year == 0


# ── parse_transaction — "All done" format ────────────────────────────────────

class TestParseTransactionAllDone:
    def setup_method(self):
        self.txn = parse_transaction(
            ALL_DONE_HTML, "23 February 2024", "2024-02-23",
            "All done! Your transfer 189895874 has been paid",
            "Patrick Kayombya", RATES,
        )

    def test_amount_extracted(self):
        assert self.txn.amount == "206247.00"

    def test_currency_extracted(self):
        assert self.txn.currency == "UGX"

    def test_transaction_number_extracted(self):
        assert self.txn.transaction_number == "189895874"

    def test_country_extracted_from_body(self):
        assert self.txn.country == "Uganda"

    def test_eur_conversion(self):
        expected = f"{206247.0 / 4100.0:.2f}"
        assert self.txn.amount_eur == expected

    def test_date_and_sort_key(self):
        assert self.txn.date == "23 February 2024"
        assert self.txn.sort_key == "2024-02-23"

    def test_recipient_name(self):
        assert self.txn.recipient_name == "Patrick Kayombya"


# ── parse_transaction — "We're on it" checklist format ───────────────────────

class TestParseTransactionChecklist:
    def setup_method(self):
        self.txn = parse_transaction(
            CHECKLIST_HTML, "11 March 2023", "2023-03-11",
            "We're on it! 180799565",
            "Patrick Kayombya", RATES,
        )

    def test_amount_extracted(self):
        assert self.txn.amount == "1162918.00"

    def test_currency_extracted(self):
        assert self.txn.currency == "UGX"

    def test_transaction_number_extracted(self):
        assert self.txn.transaction_number == "180799565"

    def test_country_falls_back_to_currency_map(self):
        # No "to Uganda" line in checklist format → inferred from UGX
        assert self.txn.country == "Uganda"


# ── parse_transaction — EUR transfer ─────────────────────────────────────────

class TestParseTransactionEUR:
    def setup_method(self):
        self.txn = parse_transaction(
            EUR_TRANSFER_HTML, "07 October 2021", "2021-10-07",
            "All done! Your transfer 106669342 has been paid",
            "Patrick Kayombya", RATES,
        )

    def test_eur_amount_is_identity(self):
        assert self.txn.amount == "30.99"
        assert self.txn.currency == "EUR"
        assert self.txn.amount_eur == "30.99"

    def test_country(self):
        assert self.txn.country == "Europe"


# ── parse_transaction — missing fields ───────────────────────────────────────

class TestParseTransactionMissingFields:
    def test_missing_transaction_number_returns_na(self):
        txn = parse_transaction(
            MISSING_TXN_HTML, "14 August 2023", "2023-08-14",
            "All done!", "Patrick", RATES,
        )
        assert txn.transaction_number == "N/A"
        assert txn.amount == "80634.00"

    def test_missing_amount_returns_na(self):
        txn = parse_transaction(
            MISSING_AMOUNT_HTML, "14 August 2023", "2023-08-14",
            "We're on it!", "Patrick", RATES,
        )
        assert txn.amount == "N/A"
        assert txn.amount_eur == "N/A"

    def test_txn_number_extracted_from_subject_fallback(self):
        txn = parse_transaction(
            MISSING_TXN_HTML, "14 August 2023", "2023-08-14",
            "All done! Your transfer 999888777 has been paid",
            "Patrick", RATES,
        )
        assert txn.transaction_number == "999888777"

    def test_returns_none_on_garbage_input(self):
        # Should not raise — returns a transaction with N/A fields
        txn = parse_transaction("", "01 Jan 2023", "2023-01-01", "", "Patrick", RATES)
        assert txn is not None
