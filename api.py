"""
FiscalFlow — FastAPI backend.
Run locally: uvicorn api:app --reload
"""

import asyncio
import os
import tempfile
from dataclasses import asdict
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from worldremit import WorldRemitExtractor
from worldremit.report import generate_pdf_report, export_csv

# ── DB backend — MongoDB in production, SQLite locally ──────────────────────

if os.getenv("MONGODB_URI"):
    from worldremit.db_mongo import save_transactions, load_transactions, get_stats
else:
    from worldremit.db import save_transactions, load_transactions, get_stats

# ── App setup ────────────────────────────────────────────────────────────────

app = FastAPI(title="FiscalFlow API", version="1.0.0")

_ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,https://*.vercel.app",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic models ───────────────────────────────────────────────────────────


class ExtractRequest(BaseModel):
    email: str
    password: str
    recipient_name: str
    start_year: int
    end_year: int
    lang: str = "fr"


class ReportRequest(BaseModel):
    transactions: list
    eur_rates: dict = {}
    recipient_name: str
    start_year: int
    end_year: int
    lang: str = "fr"


# ── Routes ────────────────────────────────────────────────────────────────────


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/extract")
async def extract(req: ExtractRequest):
    """Connect to IMAP, extract WorldRemit transactions and persist them."""
    extractor = WorldRemitExtractor(req.email, req.password)
    loop = asyncio.get_event_loop()

    ok = await loop.run_in_executor(None, extractor.connect_to_email)
    if not ok:
        raise HTTPException(
            status_code=400,
            detail="Connexion email échouée. Vérifiez vos identifiants et le mot de passe d'application.",
        )

    try:
        await loop.run_in_executor(
            None,
            extractor.process_emails,
            req.recipient_name,
            req.start_year,
            req.end_year,
        )
    finally:
        extractor.disconnect()

    if not extractor.transactions:
        return {
            "transactions": [],
            "eur_rates": {},
            "saved": 0,
            "stats": get_stats(),
        }

    saved = save_transactions(extractor.transactions)

    return {
        "transactions": [asdict(t) for t in extractor.transactions],
        "eur_rates": extractor.eur_rates,
        "saved": saved,
        "stats": get_stats(),
    }


@app.post("/api/report/pdf")
async def report_pdf(req: ReportRequest):
    """Generate a PDF report from a transactions payload and stream it back."""
    from worldremit.models import WorldRemitTransaction

    txns = [WorldRemitTransaction(**t) for t in req.transactions]

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        tmp_path = f.name

    generate_pdf_report(
        txns,
        req.eur_rates,
        output_file=tmp_path,
        recipient_name=req.recipient_name,
        start_year=req.start_year,
        end_year=req.end_year,
        lang=req.lang,
    )

    pdf_bytes = Path(tmp_path).read_bytes()
    Path(tmp_path).unlink(missing_ok=True)

    period = (
        str(req.start_year)
        if req.start_year == req.end_year
        else f"{req.start_year}-{req.end_year}"
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="rapport_{period}.pdf"'},
    )


@app.post("/api/report/csv")
async def report_csv(req: ReportRequest):
    """Generate a CSV export from a transactions payload."""
    from worldremit.models import WorldRemitTransaction

    txns = [WorldRemitTransaction(**t) for t in req.transactions]
    csv_str = export_csv(txns, lang=req.lang)

    period = (
        str(req.start_year)
        if req.start_year == req.end_year
        else f"{req.start_year}-{req.end_year}"
    )
    return Response(
        content=csv_str.encode("utf-8-sig"),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="transactions_{period}.csv"'},
    )


@app.get("/api/transactions")
async def get_transactions(
    recipient_name: Optional[str] = None,
    start_year: Optional[int] = None,
    end_year: Optional[int] = None,
):
    """Query persisted transactions with optional filters."""
    txns = load_transactions(
        recipient_name=recipient_name,
        start_year=start_year,
        end_year=end_year,
    )
    return {"transactions": [asdict(t) for t in txns]}


@app.get("/api/stats")
async def stats():
    """Return aggregate statistics about stored transactions."""
    return get_stats()
