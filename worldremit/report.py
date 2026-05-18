"""
PDF report generation and JSON backup for WorldRemit transactions.
"""

import json
from dataclasses import asdict
from datetime import datetime
from typing import Dict, List

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)

from .models import LOGO_PATH, TRANSLATIONS, WorldRemitTransaction


def _localise_date(date_str: str, months: Dict[str, str]) -> str:
    for en, local in months.items():
        date_str = date_str.replace(en, local)
    return date_str


def generate_pdf_report(
    transactions: List[WorldRemitTransaction],
    eur_rates: Dict[str, float],
    output_file: str = "worldremit_transactions_report.pdf",
    recipient_name: str = "Patrick Kayombya",
    start_year: int = 2023,
    end_year: int = 2023,
    lang: str = 'fr',
) -> str:
    """
    Build and save a PDF tax report.
    Returns the output file path on success, raises on failure.
    """
    tr = TRANSLATIONS.get(lang, TRANSLATIONS['fr'])
    localise = lambda d: _localise_date(d, tr['months'])

    doc = SimpleDocTemplate(output_file, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()

    # ── Logo ────────────────────────────────────────────────────────────
    if LOGO_PATH.exists():
        logo = Image(str(LOGO_PATH), width=2.2 * inch, height=0.6 * inch)
        logo.hAlign = 'CENTER'
        story.append(logo)
        story.append(Spacer(1, 10))

    # ── Title ────────────────────────────────────────────────────────────
    title_style = ParagraphStyle(
        'Title', parent=styles['Heading1'],
        fontSize=18, spaceAfter=30,
        alignment=TA_CENTER, textColor=colors.darkblue,
    )
    story.append(Paragraph(tr['title'], title_style))

    # ── Summary header ───────────────────────────────────────────────────
    currency_totals: Dict[str, float] = {}
    eur_total = 0.0
    for t in transactions:
        if t.amount != 'N/A':
            try:
                currency_totals[t.currency] = currency_totals.get(t.currency, 0) + float(t.amount)
            except ValueError:
                pass
        if t.amount_eur != 'N/A':
            try:
                eur_total += float(t.amount_eur)
            except ValueError:
                pass

    rate_parts = [
        f"{cur} : 1 EUR ≈ {eur_rates[cur]:.2f} {cur}"
        for cur in sorted(currency_totals)
        if cur in eur_rates
    ]
    rate_note = "  |  ".join(rate_parts) or "N/A"
    period_str = str(start_year) if start_year == end_year else f"{start_year} – {end_year}"
    report_date = localise(datetime.now().strftime("%d %B %Y"))

    info_style = ParagraphStyle(
        'Info', parent=styles['Normal'],
        fontSize=10, spaceAfter=20, alignment=TA_LEFT,
    )
    info_text = (
        f"<b>{tr['report_date']} :</b> {report_date}<br/>"
        f"<b>{tr['total_txn']} :</b> {len(transactions)}<br/>"
        f"<b>{tr['recipient']} :</b> {recipient_name}<br/>"
        f"<b>{tr['period']} :</b> {period_str}<br/>"
        f"<b>{tr['total_eur']} :</b> {eur_total:,.2f} EUR<br/>"
        f"<i>{tr['rates_note']} : {rate_note}</i>"
    )
    story.append(Paragraph(info_text, info_style))
    story.append(Spacer(1, 20))

    if not transactions:
        story.append(Paragraph(tr['no_txn'], styles['Normal']))
        doc.build(story)
        return output_file

    # ── Table ─────────────────────────────────────────────────────────────
    rows = [[
        tr['col_date'], tr['col_amount'], tr['col_currency'],
        tr['col_eur'],  tr['col_txn'],   tr['col_country'],
    ]]
    for t in sorted(transactions, key=lambda x: x.sort_key):
        rows.append([
            localise(t.date),
            t.amount,
            t.currency,
            t.amount_eur,
            t.transaction_number,
            t.country or '—',
        ])

    col_widths = [1.6*inch, 1.05*inch, 0.55*inch, 0.8*inch, 1.5*inch, 1.0*inch]
    table = Table(rows, colWidths=col_widths)
    table.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, 0),  colors.darkblue),
        ('TEXTCOLOR',     (0, 0), (-1, 0),  colors.whitesmoke),
        ('FONTNAME',      (0, 0), (-1, 0),  'Helvetica-Bold'),
        ('FONTSIZE',      (0, 0), (-1, 0),  9),
        ('BOTTOMPADDING', (0, 0), (-1, 0),  10),
        ('FONTNAME',      (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE',      (0, 1), (-1, -1), 7.5),
        ('ALIGN',         (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN',         (1, 1), (3, -1),  'RIGHT'),
        ('ROWBACKGROUNDS',(0, 1), (-1, -1), [colors.white, colors.Color(0.93, 0.95, 1.0)]),
        ('GRID',          (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(table)

    # ── Currency summary ──────────────────────────────────────────────────
    story.append(Spacer(1, 30))
    summary_style = ParagraphStyle(
        'Summary', parent=styles['Normal'], fontSize=10, leftIndent=20,
    )
    lines = [f"<b>{tr['summary_title']} :</b><br/>"]
    for cur, total in sorted(currency_totals.items()):
        rate = eur_rates.get(cur, 0)
        eur_eq = total / rate if rate > 0 else 0
        lines.append(f"{cur} : {total:,.2f}  (≈ {eur_eq:,.2f} EUR)<br/>")
    lines.append(f"<br/><b>{tr['total_eur_lbl']} : {eur_total:,.2f} EUR</b><br/>")
    lines.append(f"<i>{tr['disclaimer']}</i>")
    story.append(Paragraph("".join(lines), summary_style))

    doc.build(story)
    print(f"PDF report generated: {output_file}")
    return output_file


def save_json_backup(
    transactions: List[WorldRemitTransaction],
    output_file: str = "worldremit_transactions.json",
) -> str:
    """Serialise transactions to JSON. Returns the output file path."""
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump([asdict(t) for t in transactions], f, indent=2, ensure_ascii=False)
    print(f"JSON backup saved: {output_file}")
    return output_file
