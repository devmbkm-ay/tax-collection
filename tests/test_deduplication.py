"""
Tests for deduplication logic in worldremit/email_client.py
"""

import pytest
from worldremit.email_client import _upsert
from worldremit.models import WorldRemitTransaction


def make_txn(**kwargs) -> WorldRemitTransaction:
    defaults = dict(
        date="14 August 2023",
        amount="196835.00",
        currency="UGX",
        amount_eur="45.51",
        recipient_name="Patrick Kayombya",
        transaction_number="171747057",
        email_subject="All done! Your transfer 171747057 has been paid",
        country="Uganda",
        sort_key="2023-08-14",
    )
    defaults.update(kwargs)
    return WorldRemitTransaction(**defaults)


# ── Same TXN number ───────────────────────────────────────────────────────────

class TestSameTransactionNumber:
    def test_keeps_all_done_over_were_on_it(self):
        txns = []
        were_on_it = make_txn(email_subject="We're on it! 171747057")
        all_done   = make_txn(email_subject="All done! Your transfer 171747057 has been paid")
        _upsert(txns, were_on_it)
        _upsert(txns, all_done)
        assert len(txns) == 1
        assert "All done" in txns[0].email_subject

    def test_reverse_order_still_keeps_all_done(self):
        txns = []
        all_done   = make_txn(email_subject="All done! Your transfer 171747057 has been paid")
        were_on_it = make_txn(email_subject="We're on it! 171747057")
        _upsert(txns, all_done)
        _upsert(txns, were_on_it)
        assert len(txns) == 1
        assert "All done" in txns[0].email_subject

    def test_exactly_one_entry_per_txn(self):
        txns = []
        for _ in range(3):
            _upsert(txns, make_txn())
        assert len(txns) == 1


# ── TXN number N/A — fallback by date+amount+currency ────────────────────────

class TestFallbackDeduplication:
    def test_known_txn_plus_na_merges(self):
        """Your reported issue: one email has TXN, the other has N/A."""
        txns = []
        with_txn = make_txn(transaction_number="171747057",
                            email_subject="We're on it!")
        without  = make_txn(transaction_number="N/A",
                            email_subject="All done! Your transfer 171747057 has been paid")
        _upsert(txns, with_txn)
        _upsert(txns, without)
        assert len(txns) == 1

    def test_txn_number_carried_forward_to_winner(self):
        """Winner (All done) should keep the TXN number from the loser."""
        txns = []
        with_txn = make_txn(transaction_number="171747057",
                            email_subject="We're on it!")
        without  = make_txn(transaction_number="N/A",
                            email_subject="All done!")
        _upsert(txns, with_txn)
        _upsert(txns, without)
        assert txns[0].transaction_number == "171747057"

    def test_different_amounts_same_day_kept_separate(self):
        txns = []
        _upsert(txns, make_txn(amount="196835.00", transaction_number="111111"))
        _upsert(txns, make_txn(amount="999999.00", transaction_number="222222"))
        assert len(txns) == 2

    def test_different_currencies_same_day_kept_separate(self):
        txns = []
        _upsert(txns, make_txn(currency="UGX", transaction_number="N/A"))
        _upsert(txns, make_txn(currency="USD", transaction_number="N/A"))
        assert len(txns) == 2

    def test_both_na_different_amounts_kept_separate(self):
        txns = []
        _upsert(txns, make_txn(amount="100.00", transaction_number="N/A"))
        _upsert(txns, make_txn(amount="200.00", transaction_number="N/A"))
        assert len(txns) == 2


# ── Genuine different transactions ───────────────────────────────────────────

class TestGenuinelyDifferent:
    def test_different_dates_always_separate(self):
        txns = []
        _upsert(txns, make_txn(sort_key="2023-08-14", transaction_number="111111"))
        _upsert(txns, make_txn(sort_key="2023-09-01", transaction_number="222222"))
        assert len(txns) == 2

    def test_multiple_unique_transactions(self):
        txns = []
        for i in range(5):
            _upsert(txns, make_txn(
                transaction_number=str(100000 + i),
                sort_key=f"2023-0{i+1}-01",
            ))
        assert len(txns) == 5

    def test_prefer_entry_with_known_txn_over_na(self):
        txns = []
        na_first  = make_txn(transaction_number="N/A",       email_subject="We're on it!")
        has_txn   = make_txn(transaction_number="171747057", email_subject="We're on it!")
        _upsert(txns, na_first)
        _upsert(txns, has_txn)
        assert len(txns) == 1
        assert txns[0].transaction_number == "171747057"
