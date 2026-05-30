"""
MongoDB persistence layer — used in production when MONGODB_URI is set.
Falls back gracefully; db.py (SQLite) is used for local development.
"""

import os
from datetime import datetime, timezone
from typing import List, Optional

from pymongo import ASCENDING, MongoClient
from pymongo.errors import DuplicateKeyError

from .models import WorldRemitTransaction

_client: Optional[MongoClient] = None
_db = None


def _collection():
    global _client, _db
    if _client is None:
        uri = os.environ["MONGODB_URI"]
        _client = MongoClient(uri)
        _db = _client["fiscalflow"]
        coll = _db["transactions"]
        coll.create_index(
            [
                ("sort_key", ASCENDING),
                ("amount", ASCENDING),
                ("currency", ASCENDING),
                ("transaction_number", ASCENDING),
            ],
            unique=True,
            name="dedup_idx",
        )
    return _db["transactions"]


def save_transactions(transactions: List[WorldRemitTransaction]) -> int:
    coll = _collection()
    inserted = 0
    for t in transactions:
        doc = {
            "sort_key": t.sort_key,
            "date": t.date,
            "amount": t.amount,
            "currency": t.currency,
            "amount_eur": t.amount_eur,
            "recipient_name": t.recipient_name,
            "transaction_number": t.transaction_number,
            "email_subject": t.email_subject,
            "country": t.country,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            coll.insert_one(doc)
            inserted += 1
        except DuplicateKeyError:
            pass
    return inserted


def load_transactions(
    recipient_name: Optional[str] = None,
    start_year: Optional[int] = None,
    end_year: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[List[WorldRemitTransaction], int]:
    """Return (transactions, total_count) for the requested page."""
    coll = _collection()
    query: dict = {}

    if recipient_name:
        query["recipient_name"] = recipient_name

    sort_key_filter: dict = {}
    if start_year:
        sort_key_filter["$gte"] = f"{start_year}-01-01"
    if end_year:
        sort_key_filter["$lte"] = f"{end_year}-12-31"
    if sort_key_filter:
        query["sort_key"] = sort_key_filter

    total = coll.count_documents(query)
    docs = (
        coll.find(query)
        .sort("sort_key", ASCENDING)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    txns = [
        WorldRemitTransaction(
            date=d["date"],
            amount=d["amount"],
            currency=d["currency"],
            amount_eur=d.get("amount_eur") or "N/A",
            recipient_name=d.get("recipient_name") or "",
            transaction_number=d.get("transaction_number") or "N/A",
            email_subject=d.get("email_subject") or "",
            country=d.get("country") or "",
            sort_key=d["sort_key"],
        )
        for d in docs
    ]
    return txns, total


def get_stats() -> dict:
    coll = _collection()
    total = coll.count_documents({})
    recipients = [r for r in coll.distinct("recipient_name") if r]

    pipeline = [
        {
            "$group": {
                "_id": None,
                "min_year": {"$min": {"$substr": ["$sort_key", 0, 4]}},
                "max_year": {"$max": {"$substr": ["$sort_key", 0, 4]}},
            }
        }
    ]
    agg = list(coll.aggregate(pipeline))
    year_range = None
    if agg and agg[0].get("min_year"):
        year_range = (int(agg[0]["min_year"]), int(agg[0]["max_year"]))

    return {"total": total, "recipients": recipients, "year_range": year_range}
