"""
Tests for worldremit/exchange.py
"""

import pytest
from worldremit.exchange import to_eur

RATES = {'UGX': 4100.0, 'USD': 1.08, 'GBP': 0.86, 'EUR': 1.0}


class TestToEur:
    def test_ugx_conversion(self):
        result = to_eur("206247.00", "UGX", RATES)
        assert result == f"{206247.0 / 4100.0:.2f}"

    def test_usd_conversion(self):
        result = to_eur("100.00", "USD", RATES)
        assert result == f"{100.0 / 1.08:.2f}"

    def test_eur_is_identity(self):
        assert to_eur("30.99", "EUR", RATES) == "30.99"

    def test_unknown_currency_returns_na(self):
        assert to_eur("100.00", "XYZ", RATES) == "N/A"

    def test_invalid_amount_returns_na(self):
        assert to_eur("not_a_number", "UGX", RATES) == "N/A"

    def test_empty_rates_returns_na(self):
        assert to_eur("100.00", "UGX", {}) == "N/A"

    def test_zero_rate_returns_na(self):
        assert to_eur("100.00", "UGX", {"UGX": 0}) == "N/A"

    def test_result_is_string(self):
        assert isinstance(to_eur("100.00", "EUR", RATES), str)

    def test_two_decimal_places(self):
        result = to_eur("100.00", "USD", RATES)
        assert len(result.split(".")[-1]) == 2
