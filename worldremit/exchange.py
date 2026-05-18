"""
EUR exchange rate fetching with offline fallback.
"""

import json
import urllib.request
from typing import Dict

_FALLBACK_RATES: Dict[str, float] = {
    'UGX': 4100.0, 'USD': 1.08, 'GBP': 0.86,
    'CAD': 1.47,   'AUD': 1.65, 'CHF': 0.94,
}


def fetch_eur_rates() -> Dict[str, float]:
    """
    Fetch EUR-based rates from open.er-api.com (no API key required).
    Returns a dict where rate means 1 EUR = rate units of that currency.
    Falls back to hardcoded 2024 approximations on any network failure.
    """
    try:
        url = 'https://open.er-api.com/v6/latest/EUR'
        with urllib.request.urlopen(url, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            if data.get('result') == 'success':
                print(f"  Exchange rates fetched ({data.get('time_last_update_utc', 'unknown')})")
                return data['rates']
    except Exception:
        pass
    print("  Warning: Could not fetch live rates. Using approximate 2024 rates.")
    return _FALLBACK_RATES.copy()


def to_eur(amount_str: str, currency: str, rates: Dict[str, float]) -> str:
    """Convert an amount string to EUR using the provided rate table."""
    try:
        amount = float(amount_str)
        if currency == 'EUR':
            return f"{amount:.2f}"
        rate = rates.get(currency, 0)
        if rate > 0:
            return f"{amount / rate:.2f}"
    except (ValueError, ZeroDivisionError):
        pass
    return 'N/A'
