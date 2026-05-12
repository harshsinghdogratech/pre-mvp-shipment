from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session, sessionmaker, declarative_base

from app.config import settings

if settings.use_sqlite:
    engine = create_engine(
        "sqlite:///./shipment.db",
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_schema_compat() -> None:
    insp = inspect(engine)

    # --- users.suite_number migration ---
    if insp.has_table("users"):
        user_cols = {c["name"] for c in insp.get_columns("users")}
        if "suite_number" not in user_cols:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        "ALTER TABLE users "
                        "ADD COLUMN suite_number VARCHAR(50)"
                    )
                )
                conn.execute(
                    text(
                        "CREATE UNIQUE INDEX IF NOT EXISTS "
                        "ix_users_suite_number "
                        "ON users (suite_number) "
                        "WHERE suite_number IS NOT NULL"
                    )
                )

    # --- invoices columns migration ---
    if insp.has_table("invoices"):
        inv_cols = {c["name"] for c in insp.get_columns("invoices")}
        with engine.begin() as conn:
            if "review_status" not in inv_cols:
                conn.execute(
                    text(
                        "ALTER TABLE invoices "
                        "ADD COLUMN review_status VARCHAR(32) "
                        "NOT NULL DEFAULT 'pending'"
                    )
                )
            if "admin_notes" not in inv_cols:
                conn.execute(
                    text(
                        "ALTER TABLE invoices "
                        "ADD COLUMN admin_notes TEXT"
                    )
                )
            if "reviewed_at" not in inv_cols:
                conn.execute(
                    text(
                        "ALTER TABLE invoices "
                        "ADD COLUMN reviewed_at TIMESTAMPTZ"
                    )
                )
            if "reviewed_by" not in inv_cols:
                conn.execute(
                    text(
                        "ALTER TABLE invoices "
                        "ADD COLUMN reviewed_by INTEGER "
                        "REFERENCES users(id)"
                    )
                )


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
