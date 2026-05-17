#!/usr/bin/env python3
"""
Configuration settings for WorldRemit Email Extractor
"""

# Email server settings for different providers
EMAIL_PROVIDERS = {
    'outlook': {
        'imap_server': 'outlook.office365.com',
        'imap_port': 993,
        'requires_app_password': True
    },
    'gmail': {
        'imap_server': 'imap.gmail.com',
        'imap_port': 993,
        'requires_app_password': True
    },
    'yahoo': {
        'imap_server': 'imap.mail.yahoo.com',
        'imap_port': 993,
        'requires_app_password': True
    }
}

# WorldRemit email patterns
WORLDREMIT_PATTERNS = {
    'from_addresses': [
        'worldremit',
        'noreply@worldremit.com',
        'no-reply@worldremit.com',
        'remittance@worldremit.com'
    ],
    'subject_keywords': [
        'transaction',
        'receipt',
        'confirmation',
        'money transfer',
        'remittance'
    ]
}

# Data extraction patterns (regex)
EXTRACTION_PATTERNS = {
    'amount': [
        r'Amount sent[:\s]+([A-Z]{3}\s*[\d,]+\.?\d*)',
        r'You sent[:\s]+([A-Z]{3}\s*[\d,]+\.?\d*)',
        r'Total[:\s]+([A-Z]{3}\s*[\d,]+\.?\d*)',
        r'([A-Z]{3}\s*[\d,]+\.?\d*)\s*sent',
        r'Transfer amount[:\s]+([A-Z]{3}\s*[\d,]+\.?\d*)'
    ],
    'recipient_name': [
        r'Recipient[:\s]+([^\n\r]+)',
        r'To[:\s]+([A-Z][a-zA-Z\s]+)',
        r'Sending to[:\s]+([^\n\r]+)',
        r'Beneficiary[:\s]+([^\n\r]+)'
    ],
    'transaction_number': [
        r'Transaction (?:number|ID|ref)[:\s]*([A-Z0-9-]+)',
        r'Reference[:\s]*([A-Z0-9-]+)',
        r'MTCN[:\s]*([A-Z0-9-]+)',
        r'Tracking number[:\s]*([A-Z0-9-]+)'
    ],
    'date': [
        r'Date[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        r'Sent on[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})',
        r'Transfer date[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'
    ]
}

# PDF report settings
PDF_SETTINGS = {
    'page_size': 'A4',
    'margins': {
        'top': 72,
        'bottom': 72,
        'left': 72,
        'right': 72
    },
    'fonts': {
        'title': {'name': 'Helvetica-Bold', 'size': 18},
        'header': {'name': 'Helvetica-Bold', 'size': 12},
        'body': {'name': 'Helvetica', 'size': 10},
        'small': {'name': 'Helvetica', 'size': 8}
    },
    'colors': {
        'header_bg': '#2E4BC6',
        'header_text': '#FFFFFF',
        'alt_row': '#F5F5F5'
    }
}

# Default settings
DEFAULT_SETTINGS = {
    'recipient_name': 'Marie Thérèse Clarisse',
    'start_year': 2021,
    'output_pdf': 'worldremit_transactions_report.pdf',
    'output_json': 'worldremit_transactions.json'
}
