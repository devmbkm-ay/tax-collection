"""
FiscalFlow — FastAPI backend.
Run locally: uvicorn api:app --reload
"""

import asyncio
import io
import json
import os
import queue
import tempfile
import threading
import zipfile
from dataclasses import asdict
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from worldremit import WorldRemitExtractor
from worldremit.report import generate_pdf_report, export_csv

# ── DB backend — MongoDB in production, SQLite locally ──────────────────────

if os.getenv("MONGODB_URI"):
    from worldremit.db_mongo import save_transactions, load_transactions, get_stats, update_transaction as update_transaction_db, save_eur_rates, get_eur_rates
else:
    from worldremit.db import save_transactions, load_transactions, get_stats, update_transaction as update_transaction_db, save_eur_rates, get_eur_rates

# ── App setup ────────────────────────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="FiscalFlow API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
    email: str = Field(max_length=254)
    password: str = Field(max_length=200)
    recipient_name: Optional[str] = Field(default=None, max_length=200)
    recipient_names: Optional[List[str]] = Field(default=None, max_length=10)
    start_year: int = Field(ge=2000, le=2100)
    start_month: int = Field(default=1, ge=1, le=12)
    end_year: int = Field(ge=2000, le=2100)
    end_month: int = Field(default=12, ge=1, le=12)
    lang: str = Field(default="fr", pattern="^(fr|en)$")

    @field_validator("recipient_names", mode="before")
    @classmethod
    def validate_recipient_names(cls, v):
        if v is not None:
            if len(v) > 10:
                raise ValueError("Maximum 10 recipients allowed.")
            for name in v:
                if len(name) > 200:
                    raise ValueError("Recipient name must be 200 characters or fewer.")
        return v

    @field_validator("end_year", mode="after")
    @classmethod
    def validate_year_range(cls, end_year, info):
        start_year = info.data.get("start_year")
        if start_year is not None and end_year < start_year:
            raise ValueError("end_year must be >= start_year.")
        return end_year


class TestConnectionRequest(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=200)


class UpdateTransactionRequest(BaseModel):
    sort_key: str = Field(max_length=200)
    amount: str = Field(max_length=50)
    currency: str = Field(max_length=10)
    transaction_number: str = Field(max_length=100)
    recipient_name: Optional[str] = Field(default=None, max_length=200)
    country: Optional[str] = Field(default=None, max_length=100)
    amount_eur: Optional[str] = Field(default=None, max_length=50)

    @field_validator("amount_eur", mode="before")
    @classmethod
    def validate_amount_eur(cls, v):
        if v is not None:
            try:
                float(v)
            except (ValueError, TypeError):
                raise ValueError("amount_eur must be a valid decimal number.")
        return v


class ReportRequest(BaseModel):
    transactions: list = Field(max_length=5000)
    eur_rates: dict = {}
    recipient_name: str = Field(max_length=200)
    start_year: int = Field(ge=2000, le=2100)
    end_year: int = Field(ge=2000, le=2100)
    lang: str = Field(default="fr", pattern="^(fr|en)$")
    declarant_name: str = Field(default="", max_length=200)
    declarant_address: str = Field(default="", max_length=500)


# ── Routes ────────────────────────────────────────────────────────────────────


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/test-connection")
@limiter.limit("10/minute")
async def test_connection(request: Request, req: TestConnectionRequest):
    """Fast IMAP probe — returns 200 on success, 400 with a friendly message on failure."""
    from worldremit.email_client import probe_connection
    loop = asyncio.get_event_loop()
    ok, message = await loop.run_in_executor(None, probe_connection, req.email, req.password)
    if not ok:
        raise HTTPException(status_code=400, detail=message)
    return {"message": message}


@app.post("/api/extract/stream")
@limiter.limit("5/minute")
async def extract_stream(request: Request, req: ExtractRequest):  # noqa: ARG001
    """SSE stream of extraction progress. Emits JSON events until 'done' or 'error'."""
    from worldremit.email_client import EmailClient
    from worldremit.exchange import fetch_eur_rates

    q: queue.Queue = queue.Queue()

    def emit(**kwargs):
        q.put(kwargs)

    def run():
        try:
            emit(step="connecting")
            client = EmailClient(req.email, req.password)
            if not client.connect():
                emit(step="error", message="Connexion échouée. Vérifiez vos identifiants et le mot de passe d'application.")
                return

            emit(step="rates")
            eur_rates = fetch_eur_rates()
            save_eur_rates(eur_rates)

            names: List[Optional[str]] = req.recipient_names or (
                [req.recipient_name] if req.recipient_name else [None]
            )

            transactions = client.fetch_transactions(
                names, req.start_year, req.end_year, eur_rates,
                on_progress=emit,
                start_month=req.start_month,
                end_month=req.end_month,
            )
            client.disconnect()

            emit(step="saving")
            saved = save_transactions(transactions) if transactions else 0

            emit(
                step="done",
                transactions=[asdict(t) for t in transactions],
                eur_rates=eur_rates,
                saved=saved,
                stats=get_stats(),
            )
        except Exception as e:
            emit(step="error", message=str(e))
        finally:
            q.put(None)

    async def event_stream():
        loop = asyncio.get_running_loop()
        t = threading.Thread(target=run, daemon=True)
        t.start()
        while True:
            event = await loop.run_in_executor(None, q.get)
            if event is None:
                break
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/extract")
@limiter.limit("5/minute")
async def extract(request: Request, req: ExtractRequest):  # noqa: ARG001
    """Connect to IMAP, extract WorldRemit transactions and persist them."""
    extractor = WorldRemitExtractor(req.email, req.password)
    loop = asyncio.get_event_loop()

    ok = await loop.run_in_executor(None, extractor.connect_to_email)
    if not ok:
        raise HTTPException(
            status_code=400,
            detail="Connexion email échouée. Vérifiez vos identifiants et le mot de passe d'application.",
        )

    # Build the list of names to search: prefer recipient_names, fall back to
    # recipient_name (single), fall back to [None] (auto-detect from content)
    names: List[Optional[str]] = req.recipient_names or (
        [req.recipient_name] if req.recipient_name else [None]
    )

    try:
        await loop.run_in_executor(
            None,
            extractor.process_emails,
            names,
            req.start_year,
            req.end_year,
        )
    finally:
        extractor.disconnect()

    if extractor.eur_rates:
        save_eur_rates(extractor.eur_rates)

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
@limiter.limit("20/minute")
async def report_pdf(request: Request, req: ReportRequest):  # noqa: ARG001
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
        declarant_name=req.declarant_name,
        declarant_address=req.declarant_address,
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
@limiter.limit("20/minute")
async def report_csv(request: Request, req: ReportRequest):  # noqa: ARG001
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


@app.post("/api/report/xlsx")
@limiter.limit("20/minute")
async def report_xlsx(request: Request, req: ReportRequest):  # noqa: ARG001
    """Generate an Excel (.xlsx) export from a transactions payload."""
    from worldremit.models import WorldRemitTransaction
    from worldremit.report import export_xlsx

    txns = [WorldRemitTransaction(**t) for t in req.transactions]
    period = (
        str(req.start_year)
        if req.start_year == req.end_year
        else f"{req.start_year}-{req.end_year}"
    )
    xlsx_bytes = export_xlsx(txns, recipient_name=req.recipient_name, period=period, lang=req.lang)
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="transactions_{period}.xlsx"'},
    )


@app.post("/api/report/zip")
@limiter.limit("20/minute")
async def report_zip(request: Request, req: ReportRequest):  # noqa: ARG001
    """Generate one PDF + CSV per unique recipient, bundled as a ZIP archive."""
    from worldremit.models import WorldRemitTransaction

    all_txns = [WorldRemitTransaction(**t) for t in req.transactions]

    by_recipient: dict = {}
    for t in all_txns:
        key = t.recipient_name.strip() if t.recipient_name else (
            "inconnu" if req.lang == "fr" else "unknown"
        )
        by_recipient.setdefault(key, []).append(t)

    period = (
        str(req.start_year)
        if req.start_year == req.end_year
        else f"{req.start_year}-{req.end_year}"
    )

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, txns in by_recipient.items():
            safe = name.replace(" ", "_").replace("/", "_")

            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
                tmp_path = f.name
            generate_pdf_report(
                txns, req.eur_rates,
                output_file=tmp_path,
                recipient_name=name,
                start_year=req.start_year,
                end_year=req.end_year,
                lang=req.lang,
                declarant_name=req.declarant_name,
                declarant_address=req.declarant_address,
            )
            zf.write(tmp_path, f"{safe}_{period}.pdf")
            Path(tmp_path).unlink(missing_ok=True)

            csv_str = export_csv(txns, lang=req.lang)
            zf.writestr(f"{safe}_{period}.csv", csv_str.encode("utf-8-sig"))

    return Response(
        content=buf.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="rapports_{period}.zip"'},
    )


@app.patch("/api/transactions")
@limiter.limit("60/minute")
async def patch_transaction(request: Request, req: UpdateTransactionRequest):  # noqa: ARG001
    """Update editable fields (recipient_name, country, amount_eur) of a stored transaction."""
    key = {
        "sort_key": req.sort_key,
        "amount": req.amount,
        "currency": req.currency,
        "transaction_number": req.transaction_number,
    }
    patch = {k: v for k, v in {
        "recipient_name": req.recipient_name,
        "country": req.country,
        "amount_eur": req.amount_eur,
    }.items() if v is not None}

    if not patch:
        raise HTTPException(status_code=400, detail="No updatable fields provided.")

    updated = update_transaction_db(key, patch)
    if not updated:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    return {"updated": updated}


@app.get("/api/transactions")
@limiter.limit("120/minute")
async def get_transactions(  # noqa: ARG001
    request: Request,
    recipient_name: Optional[str] = None,
    start_year: Optional[int] = None,
    start_month: int = 1,
    end_year: Optional[int] = None,
    end_month: int = 12,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=200),
):
    """Query persisted transactions with optional filters and pagination."""
    import math
    txns, total = load_transactions(
        recipient_name=recipient_name,
        start_year=start_year,
        start_month=start_month,
        end_year=end_year,
        end_month=end_month,
        page=page,
        page_size=page_size,
    )
    return {
        "transactions": [asdict(t) for t in txns],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if page_size else 1,
    }


@app.get("/api/stats")
async def stats():
    """Return aggregate statistics about stored transactions."""
    return get_stats()


@app.get("/api/rates")
async def rates(date: Optional[str] = None):
    """Return a stored exchange-rate snapshot (latest if no date given)."""
    return {"rates": get_eur_rates(date), "date": date}
