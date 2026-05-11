from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, invoices, packages, stats, users
from app.seed import seed_if_empty
from app.database import SessionLocal


def create_app() -> FastAPI:
    app = FastAPI(title="Pre-MVP Shipment API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    Base.metadata.create_all(bind=engine)

    upload_root = Path(__file__).resolve().parent.parent / "uploads" / "invoices"
    upload_root.mkdir(parents=True, exist_ok=True)

    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()

    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(users.router, prefix="/api/users", tags=["users"])
    app.include_router(stats.router, prefix="/api", tags=["stats"])
    app.include_router(packages.router, prefix="/api", tags=["packages"])
    app.include_router(invoices.router, prefix="/api", tags=["invoices"])

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
