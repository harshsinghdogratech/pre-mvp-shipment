from pathlib import Path
import logging
import re

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.exception_handlers import http_exception_handler
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import Base, engine, SessionLocal, ensure_schema_compat
from app.routers import admin, auth, client_routes
from app.seed import (
    ensure_client_suite_numbers,
    reconcile_demo_accounts,
    seed_if_empty,
)


def create_app() -> FastAPI:
    app = FastAPI(title="Ship2Aruba API", version="0.2.0")

    def _cors_headers(request: Request) -> dict[str, str]:
        origin = request.headers.get("origin")
        if not origin:
            return {}
        if origin in settings.cors_origin_list:
            ok = True
        else:
            rx = settings.cors_railway_origin_regex
            ok = bool(rx and re.fullmatch(rx, origin))
        if not ok:
            return {}
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }

    @app.exception_handler(Exception)
    async def unhandled_exception(request: Request, exc: Exception) -> JSONResponse:
        if isinstance(exc, HTTPException):
            return await http_exception_handler(request, exc)
        logging.getLogger("uvicorn.error").exception("Unhandled exception")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "code": "INTERNAL_ERROR"},
            headers=_cors_headers(request),
        )

    _rx = settings.cors_railway_origin_regex
    if _rx:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origin_list,
            allow_origin_regex=_rx,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    else:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origin_list,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={
                "error": "Validation error",
                "code": "VALIDATION_ERROR",
                "details": exc.errors(),
            },
            headers=_cors_headers(request),
        )

    Base.metadata.create_all(bind=engine)
    ensure_schema_compat()

    upload_root = (
        Path(__file__).resolve().parent.parent / "uploads" / "invoices"
    )
    upload_root.mkdir(parents=True, exist_ok=True)

    db = SessionLocal()
    try:
        seed_if_empty(db)
        reconcile_demo_accounts(db)
        ensure_client_suite_numbers(db)
    finally:
        db.close()

    app.include_router(
        auth.router, prefix="/api/auth", tags=["auth"]
    )
    app.include_router(
        admin.router, prefix="/api/admin", tags=["admin"]
    )
    app.include_router(
        client_routes.router, prefix="/api/client", tags=["client"]
    )

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
