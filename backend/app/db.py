import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker


DEFAULT_POSTGRES_URL = "postgresql+psycopg2://postgres:postgres@127.0.0.1:5432/avila_pos"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_POSTGRES_URL)

# Fallback útil para entornos sin PostgreSQL (tests/local rápida)
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    connect_args = {}

engine = create_engine(DATABASE_URL, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_invoice_dir() -> Path:
    base = Path(os.getenv("INVOICE_STORAGE_DIR", "backend/invoices"))
    base.mkdir(parents=True, exist_ok=True)
    return base
