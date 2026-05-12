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
    if not insp.has_table("users"):
        return
    names = {c["name"] for c in insp.get_columns("users")}
    if "suite_number" in names:
        return
    dialect = engine.dialect.name
    with engine.begin() as conn:
        if dialect == "postgresql":
            conn.execute(
                text("ALTER TABLE users ADD COLUMN suite_number VARCHAR(50)")
            )
            conn.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_suite_number "
                    "ON users (suite_number) WHERE suite_number IS NOT NULL"
                )
            )
        else:
            conn.execute(
                text("ALTER TABLE users ADD COLUMN suite_number VARCHAR(50)")
            )
            conn.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_suite_number "
                    "ON users (suite_number) WHERE suite_number IS NOT NULL"
                )
            )


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
