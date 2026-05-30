"""
SQLite persistence layer for WorldRemit transactions.

Provides incremental imports — already-stored transactions are skipped,
so re-running the extractor never creates duplicates in the database.
"""

import sqlite3
from contextlib import contextmanager
from dataclasses import asdict
from pathlib import Path
from typing import List, Optional

from .models import WorldRemitTransaction

DEFAULT_DB = Path(__file__).parent.parent / "worldremit_transactions.db"

_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS transactions (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    sort_key           TEXT    NOT NULL,
    date               TEXT    NOT NULL,
    amount             TEXT    NOT NULL,
    currency           TEXT    NOT NULL,
    amount_eur         TEXT,
    recipient_name     TEXT,
    transaction_number TEXT,
    email_subject      TEXT,
    country            TEXT,
    created_at         TEXT    DEFAULT (datetime('now')),
    UNIQUE (sort_key, amount, currency, transaction_number)
)
"""


@contextmanager
def _connect(db_path: Path):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db(db_path: Path = DEFAULT_DB) -> None:
    """Create the database and table if they don't exist, and remove malformed rows."""
    with _connect(db_path) as conn:
        conn.execute(_CREATE_TABLE)
        conn.execute("DELETE FROM transactions WHERE amount IS NULL OR amount = '' OR amount = 'N/A'")


def save_transactions(
    transactions: List[WorldRemitTransaction],
    db_path: Path = DEFAULT_DB,
) -> int:
    """
    Insert transactions, skipping any that already exist (by sort_key + amount +
    currency + transaction_number). Returns the number of newly inserted rows.
    """
    init_db(db_path)
    inserted = 0
    with _connect(db_path) as conn:
        for t in transactions:
            try:
                conn.execute("""
                    INSERT INTO transactions
                        (sort_key, date, amount, currency, amount_eur,
                         recipient_name, transaction_number, email_subject, country)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    t.sort_key, t.date, t.amount, t.currency, t.amount_eur,
                    t.recipient_name, t.transaction_number, t.email_subject, t.country,
                ))
                inserted += 1
            except sqlite3.IntegrityError:
                pass  # duplicate — skip silently
    return inserted


def load_transactions(
    db_path: Path = DEFAULT_DB,
    recipient_name: Optional[str] = None,
    start_year: Optional[int] = None,
    end_year: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[List[WorldRemitTransaction], int]:
    """
    Load a page of transactions with optional filters.
    Returns (transactions, total_count).
    """
    if not db_path.exists():
        return [], 0

    where = "WHERE 1=1"
    params: list = []

    if recipient_name:
        where += " AND recipient_name = ?"
        params.append(recipient_name)
    if start_year:
        where += " AND sort_key >= ?"
        params.append(f"{start_year}-01-01")
    if end_year:
        where += " AND sort_key <= ?"
        params.append(f"{end_year}-12-31")

    with _connect(db_path) as conn:
        total = conn.execute(
            f"SELECT COUNT(*) FROM transactions {where}", params
        ).fetchone()[0]
        rows = conn.execute(
            f"SELECT * FROM transactions {where} ORDER BY sort_key ASC LIMIT ? OFFSET ?",
            params + [page_size, (page - 1) * page_size],
        ).fetchall()

    txns = [
        WorldRemitTransaction(
            date=row["date"],
            amount=row["amount"],
            currency=row["currency"],
            amount_eur=row["amount_eur"] or "N/A",
            recipient_name=row["recipient_name"] or "",
            transaction_number=row["transaction_number"] or "N/A",
            email_subject=row["email_subject"] or "",
            country=row["country"] or "",
            sort_key=row["sort_key"],
        )
        for row in rows
    ]
    return txns, total


def update_transaction(key: dict, patch: dict, db_path: Path = DEFAULT_DB) -> int:
    """Update editable fields of a transaction identified by its natural key.
    Returns the number of rows updated (0 = not found, 1 = success)."""
    if not db_path.exists():
        return 0
    allowed = {"recipient_name", "country", "amount_eur"}
    safe = {k: v for k, v in patch.items() if k in allowed}
    if not safe:
        return 0
    set_clause = ", ".join(f"{k} = ?" for k in safe)
    params = list(safe.values()) + [
        key["sort_key"], key["amount"], key["currency"], key["transaction_number"]
    ]
    with _connect(db_path) as conn:
        cur = conn.execute(
            f"UPDATE transactions SET {set_clause} "
            f"WHERE sort_key=? AND amount=? AND currency=? AND transaction_number=?",
            params,
        )
        return cur.rowcount


def get_stats(db_path: Path = DEFAULT_DB) -> dict:
    """Return basic statistics about the stored transactions."""
    if not db_path.exists():
        return {"total": 0, "recipients": [], "year_range": None}

    with _connect(db_path) as conn:
        total = conn.execute("SELECT COUNT(*) FROM transactions").fetchone()[0]
        recipients = [
            r[0] for r in conn.execute(
                "SELECT DISTINCT recipient_name FROM transactions WHERE recipient_name IS NOT NULL"
            ).fetchall()
        ]
        years = conn.execute(
            "SELECT MIN(substr(sort_key,1,4)), MAX(substr(sort_key,1,4)) FROM transactions"
        ).fetchone()

    return {
        "total": total,
        "recipients": recipients,
        "year_range": (int(years[0]), int(years[1])) if years[0] else None,
    }
