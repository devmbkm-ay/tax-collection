"""
Data structures, constants and translations for the WorldRemit extractor.
"""

from dataclasses import dataclass
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

LOGO_PATH = Path(__file__).parent.parent / "worldremit_logo.png"

# ---------------------------------------------------------------------------
# Currency helpers
# ---------------------------------------------------------------------------

KNOWN_CURRENCIES = {'UGX', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK'}

CURRENCY_COUNTRY = {
    'UGX': 'Uganda',
    'KES': 'Kenya',
    'TZS': 'Tanzania',
    'RWF': 'Rwanda',
    'ETB': 'Ethiopia',
    'GHS': 'Ghana',
    'NGN': 'Nigeria',
    'ZAR': 'Afrique du Sud',
    'XOF': "Afrique de l'Ouest",
    'USD': 'États-Unis',
    'GBP': 'Royaume-Uni',
    'CAD': 'Canada',
    'AUD': 'Australie',
    'CHF': 'Suisse',
    'SEK': 'Suède',
    'NOK': 'Norvège',
    'DKK': 'Danemark',
    'EUR': 'Europe',
}

# ---------------------------------------------------------------------------
# Translations
# ---------------------------------------------------------------------------

TRANSLATIONS: dict = {
    'fr': {
        'title':         'Rapport de Transactions WorldRemit',
        'report_date':   'Rapport généré le',
        'total_txn':     'Nombre de transactions',
        'recipient':     'Bénéficiaire',
        'period':        'Période',
        'total_eur':     'Total équivalent EUR',
        'rates_note':    'Taux de change utilisés (approximatifs)',
        'no_txn':        'Aucune transaction trouvée.',
        'col_date':      'Date',
        'col_amount':    'Montant',
        'col_currency':  'Devise',
        'col_eur':       '≈ EUR',
        'col_txn':       'N° Transaction',
        'col_country':   'Pays',
        'summary_title': 'Récapitulatif par devise',
        'total_eur_lbl': 'Total équivalent EUR',
        'disclaimer': (
            '* Les valeurs en EUR sont approximatives basées sur les taux de change '
            'actuels et peuvent différer des taux en vigueur au moment de chaque virement.'
        ),
        'months': {
            'January': 'janvier',   'February': 'février',   'March': 'mars',
            'April':   'avril',     'May':      'mai',        'June':  'juin',
            'July':    'juillet',   'August':   'août',       'September': 'septembre',
            'October': 'octobre',   'November': 'novembre',  'December':  'décembre',
        },
    },
    'en': {
        'title':         'WorldRemit Transaction Report',
        'report_date':   'Report Generated',
        'total_txn':     'Total Transactions',
        'recipient':     'Recipient',
        'period':        'Period',
        'total_eur':     'Total EUR Equivalent',
        'rates_note':    'Exchange rates used (approximate)',
        'no_txn':        'No transactions found.',
        'col_date':      'Date',
        'col_amount':    'Amount',
        'col_currency':  'Cur.',
        'col_eur':       '≈ EUR',
        'col_txn':       'Transaction #',
        'col_country':   'Country',
        'summary_title': 'Summary by Currency',
        'total_eur_lbl': 'Total EUR Equivalent',
        'disclaimer': (
            '* EUR values are approximate based on current exchange rates '
            'and may differ from rates at the time of each transfer.'
        ),
        'months': {},
    },
}

# ---------------------------------------------------------------------------
# Transaction model
# ---------------------------------------------------------------------------

@dataclass
class WorldRemitTransaction:
    date: str
    amount: str
    currency: str
    amount_eur: str
    recipient_name: str
    transaction_number: str
    email_subject: str
    country: str       # destination country, e.g. "Uganda"
    sort_key: str      # ISO date string for sorting — not displayed
