# WorldRemit Transaction Extractor

A Python tool to extract WorldRemit transaction data from emails and generate professional PDF reports for tax purposes.

## Features

- **Automated Email Processing**: Connects to your Outlook/Hotmail account via IMAP
- **Smart Data Extraction**: Uses regex patterns to extract transaction details
- **Professional PDF Reports**: Generates tax-ready reports with organized tables
- **Multiple Output Formats**: PDF for tax collectors, JSON for data backup
- **Date Range Filtering**: Extracts transactions from 2021 onwards (configurable)
- **Secure Authentication**: Uses App Passwords for secure email access

## Installation

1. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up email authentication**:
   - Enable 2-factor authentication on your Outlook account
   - Generate an App Password (not your regular password)
   - Enable IMAP in your Outlook settings

## Usage

### Quick Start

Run the main script:
```bash
python worldremit_extractor.py
```

The script will prompt you for:
- Your Outlook/Hotmail email address
- Your App Password
- Recipient name (defaults to "Marie Thérèse Clarisse")
- Start year for extraction (defaults to 2021)

### Output Files

The tool generates two files:
- `worldremit_transactions_report.pdf` - Professional report for tax purposes
- `worldremit_transactions.json` - JSON backup of all extracted data

## Email Setup Instructions

### For Outlook/Hotmail Users

1. **Enable 2-Factor Authentication**:
   - Go to Microsoft Account Security settings
   - Turn on 2-step verification

2. **Generate App Password**:
   - In Security settings, select "App passwords"
   - Create a new app password
   - Use this password (not your regular password) in the script

3. **Enable IMAP**:
   - Go to Outlook.com settings
   - Select "Mail" → "Sync email"
   - Enable "IMAP access"

### For Gmail Users (Alternative)

If you want to use Gmail instead:
1. Enable 2-factor authentication
2. Generate an App Password
3. Enable IMAP in Gmail settings
4. Modify the `imap_host` in the script to `imap.gmail.com`

## PDF Report Features

The generated PDF includes:
- **Header Information**: Report date, total transactions, recipient details
- **Transaction Table**: Date, Amount, Currency, Transaction Number, Recipient, Email Subject
- **Summary Section**: Totals by currency
- **Professional Formatting**: Tax-collector ready with proper styling

## Data Extracted

For each transaction, the tool extracts:
- **Transaction Date**
- **Amount and Currency**
- **Recipient Name and Details**
- **Transaction/Reference Number**
- **Email Subject** (for reference)

## Troubleshooting

### Common Issues

1. **IMAP Login Failed**:
   - Ensure you're using an App Password, not your regular password
   - Check that 2-factor authentication is enabled
   - Verify IMAP is enabled in your email settings

2. **No Emails Found**:
   - Check that the recipient name matches exactly
   - Verify the date range includes your transactions
   - Ensure emails are in your INBOX (not archived)

3. **Missing Transaction Data**:
   - Some fields might not be extracted if email format varies
   - Check the JSON backup for raw extracted data
   - Email formats can change over time

### Security Notes

- The script uses secure IMAP connection (SSL)
- Passwords are not stored or logged
- Only email metadata and content are processed
- No data is sent to external servers

## File Structure

```
worldremit-report/
├── worldremit_extractor.py    # Main extraction script
├── config.py                  # Configuration settings
├── requirements.txt           # Python dependencies
├── README.md                  # This file
├── worldremit_transactions_report.pdf  # Generated PDF report
└── worldremit_transactions.json        # JSON backup
```

## Configuration

You can modify extraction patterns and settings in `config.py`:
- Email server settings
- Regex patterns for data extraction
- PDF formatting options
- Default values

## Example Output

The PDF report will contain a table like:

| Date       | Amount  | Currency | Transaction # | Recipient           | Email Subject        |
|------------|---------|----------|---------------|---------------------|---------------------|
| 2023-01-15 | 500.00  | EUR      | TR123456789   | Marie Thérèse...    | WorldRemit Receipt  |
| 2023-02-20 | 750.00  | USD      | TR987654321   | Marie Thérèse...    | Transfer Complete   |

Plus summary totals by currency.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify your email settings
3. Ensure all dependencies are installed
4. Check the JSON output for debugging

## License

This tool is for personal use in extracting your own email data for tax reporting purposes.
