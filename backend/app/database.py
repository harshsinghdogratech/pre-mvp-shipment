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
    """Detect outdated schema and rebuild if needed.

    If critical columns (e.g. packages.tracking_number) are missing
    we know the schema is fundamentally stale — drop everything and
    let create_all() rebuild from the current models.
    """
    insp = inspect(engine)

    needs_rebuild = False

    # Check packages table for critical columns
    if insp.has_table("packages"):
        pkg_cols = {c["name"] for c in insp.get_columns("packages")}
        if "tracking_number" not in pkg_cols:
            needs_rebuild = True

    # Check invoices table for critical columns
    if insp.has_table("invoices"):
        inv_cols = {c["name"] for c in insp.get_columns("invoices")}
        if "review_status" not in inv_cols:
            needs_rebuild = True

    if needs_rebuild:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        return

    # --- Fine-grained column-level migrations (schema is compatible) ---

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


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
