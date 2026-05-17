#!/usr/bin/env python3
"""
Test script to verify the WorldRemit extractor setup
"""

import sys
from pathlib import Path

def test_imports():
    """Test if all required libraries can be imported."""
    print("Testing imports...")
    
    try:
        import imaplib
        print("✓ imaplib (built-in)")
    except ImportError as e:
        print(f"✗ imaplib: {e}")
        return False
    
    try:
        import email
        print("✓ email (built-in)")
    except ImportError as e:
        print(f"✗ email: {e}")
        return False
    
    try:
        from bs4 import BeautifulSoup
        print("✓ BeautifulSoup4")
    except ImportError as e:
        print(f"✗ BeautifulSoup4: {e}")
        return False
    
    try:
        from dateutil import parser
        print("✓ python-dateutil")
    except ImportError as e:
        print(f"✗ python-dateutil: {e}")
        return False
    
    try:
        from reportlab.platypus import SimpleDocTemplate
        from reportlab.lib.pagesizes import A4
        print("✓ reportlab")
    except ImportError as e:
        print(f"✗ reportlab: {e}")
        return False
    
    try:
        import json
        print("✓ json (built-in)")
    except ImportError as e:
        print(f"✗ json: {e}")
        return False
    
    return True

def test_file_structure():
    """Test if all required files exist."""
    print("\nTesting file structure...")
    
    required_files = [
        'worldremit_extractor.py',
        'config.py',
        'requirements.txt',
        'README.md'
    ]
    
    current_dir = Path('.')
    all_files_exist = True
    
    for filename in required_files:
        file_path = current_dir / filename
        if file_path.exists():
            print(f"✓ {filename}")
        else:
            print(f"✗ {filename} (missing)")
            all_files_exist = False
    
    return all_files_exist

def create_sample_data():
    """Create a sample transaction for testing PDF generation."""
    print("\nCreating sample transaction data...")
    
    from worldremit_extractor import WorldRemitTransaction
    from datetime import datetime
    
    sample_transaction = WorldRemitTransaction(
        date="2023-01-15",
        amount="500.00",
        currency="EUR",
        recipient_name="Marie Thérèse Clarisse",
        recipient_details="Recipient: Marie Thérèse Clarisse",
        transaction_number="TR123456789",
        sender_name="test@example.com",
        email_subject="WorldRemit - Transaction Receipt",
        raw_email_date="Sun, 15 Jan 2023 10:30:00 +0000"
    )
    
    print(f"✓ Sample transaction created: {sample_transaction.transaction_number}")
    return sample_transaction

def test_pdf_generation():
    """Test PDF generation with sample data."""
    print("\nTesting PDF generation...")
    
    try:
        from worldremit_extractor import WorldRemitExtractor
        
        # Create a mock extractor with sample data
        extractor = WorldRemitExtractor("test@example.com", "dummy_password")
        
        # Add sample transaction
        sample_transaction = create_sample_data()
        extractor.transactions = [sample_transaction]
        
        # Generate test PDF
        test_pdf_filename = "test_report.pdf"
        extractor.generate_pdf_report(test_pdf_filename)
        
        # Check if file was created
        if Path(test_pdf_filename).exists():
            print(f"✓ Test PDF generated successfully: {test_pdf_filename}")
            return True
        else:
            print("✗ Test PDF was not created")
            return False
            
    except Exception as e:
        print(f"✗ PDF generation failed: {e}")
        return False

def display_usage_instructions():
    """Display usage instructions."""
    print("\n" + "="*60)
    print("SETUP COMPLETE - Ready to Use!")
    print("="*60)
    print("\nTo extract your WorldRemit transactions:")
    print("\n1. Set up your email account:")
    print("   - Enable 2-factor authentication in Outlook")
    print("   - Generate an App Password")
    print("   - Enable IMAP in settings")
    print("\n2. Run the main script:")
    print("   python worldremit_extractor.py")
    print("\n3. When prompted, enter:")
    print("   - Your email address")
    print("   - Your App Password (not regular password)")
    print("   - Recipient name (Marie Thérèse Clarisse)")
    print("   - Start year (2021)")
    print("\n4. The script will generate:")
    print("   - worldremit_transactions_report.pdf (for tax purposes)")
    print("   - worldremit_transactions.json (backup data)")
    print("\nFor detailed instructions, see README.md")

def main():
    """Main test function."""
    print("WorldRemit Extractor Setup Test")
    print("="*35)
    
    all_tests_passed = True
    
    # Test imports
    if not test_imports():
        all_tests_passed = False
    
    # Test file structure
    if not test_file_structure():
        all_tests_passed = False
    
    # Test PDF generation
    if not test_pdf_generation():
        all_tests_passed = False
    
    print("\n" + "="*35)
    if all_tests_passed:
        print("✅ All tests passed! Setup is complete.")
        display_usage_instructions()
    else:
        print("❌ Some tests failed. Please check the errors above.")
        print("\nTroubleshooting:")
        print("1. Make sure all dependencies are installed: pip install -r requirements.txt")
        print("2. Check that all files are present in the directory")
        print("3. Verify Python version (3.6+ required)")
    
    return all_tests_passed

if __name__ == "__main__":
    main()
