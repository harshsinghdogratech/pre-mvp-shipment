import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_admin, require_client
from app.models import Invoice, InvoiceStatus, Package, PackageStatus, User, UserRole
from app.schemas import InvoiceOut, InvoicePendingRow, RejectBody

router = APIRouter()

ALLOWED_EXTENSIONS = frozenset(
    {"pdf", "png", "jpg", "jpeg", "doc", "docx", "xls", "xlsx"}
)
MAX_BYTES = 10 * 1024 * 1024


def uploads_dir() -> Path:
    base = Path(__file__).resolve().parent.parent.parent
    d = base / "uploads" / "invoices"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _abs_path(relative: str) -> Path:
    base = Path(__file__).resolve().parent.parent.parent
    return (base / relative).resolve()


def _can_access_invoice(user: User, inv: Invoice) -> bool:
    if user.role == UserRole.admin:
        return True
    return inv.client_id == user.id


def _original_ext(filename: str) -> str:
    if "." not in filename:
        return ""
    return filename.rsplit(".", 1)[-1].lower()


@router.post("/invoices/upload", response_model=InvoiceOut)
async def upload_invoice(
    package_id: int = Form(...),
    file: UploadFile = File(...),
    client: User = Depends(require_client),
    db: Session = Depends(get_db),
) -> Invoice:
    pkg = db.get(Package, package_id)
    if not pkg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Package not found")
    if pkg.client_id != client.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if pkg.status != PackageStatus.pending_invoice:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Invoice upload not allowed for current package status",
        )

    original = file.filename or "upload"
    ext = _original_ext(original)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    body = await file.read()
    if len(body) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds 10 MB limit",
        )

    stored_name = f"{uuid.uuid4().hex}.{ext}"
    rel_path = f"uploads/invoices/{stored_name}"
    dest = uploads_dir() / stored_name
    dest.write_bytes(body)

    inv = Invoice(
        package_id=pkg.id,
        client_id=client.id,
        original_file_name=original,
        stored_file_name=stored_name,
        file_path=rel_path,
        file_type=ext,
        status=InvoiceStatus.pending,
        rejection_reason=None,
        reviewed_at=None,
    )
    pkg.status = PackageStatus.invoice_uploaded
    pkg.updated_at = datetime.now(timezone.utc)
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv


@router.get("/invoices/pending", response_model=list[InvoicePendingRow])
def list_pending_invoices(
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> list[InvoicePendingRow]:
    rows = db.execute(
        select(Invoice, Package, User)
        .join(Package, Invoice.package_id == Package.id)
        .join(User, Invoice.client_id == User.id)
        .where(Invoice.status == InvoiceStatus.pending)
        .order_by(Invoice.uploaded_at.asc())
    ).all()
    out: list[InvoicePendingRow] = []
    for inv, pkg, usr in rows:
        out.append(
            InvoicePendingRow(
                id=inv.id,
                package_id=pkg.id,
                package_title=pkg.title,
                client_name=usr.name,
                client_email=usr.email,
                original_file_name=inv.original_file_name,
                file_type=inv.file_type,
                uploaded_at=inv.uploaded_at,
            )
        )
    return out


@router.get("/invoices/{invoice_id}", response_model=InvoiceOut)
def get_invoice(
    invoice_id: int,
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> Invoice:
    inv = db.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    if not _can_access_invoice(current, inv):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return inv


@router.get("/invoices/{invoice_id}/file")
def get_invoice_file(
    invoice_id: int,
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> FileResponse:
    inv = db.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    if not _can_access_invoice(current, inv):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    path = _abs_path(inv.file_path)
    if not path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File missing on server",
        )
    media = "application/octet-stream"
    if inv.file_type == "pdf":
        media = "application/pdf"
    elif inv.file_type in {"png", "jpg", "jpeg"}:
        media = f"image/{'jpeg' if inv.file_type in {'jpg', 'jpeg'} else inv.file_type}"
    return FileResponse(
        path,
        media_type=media,
        filename=inv.original_file_name,
    )


@router.patch("/invoices/{invoice_id}/approve", response_model=InvoiceOut)
def approve_invoice(
    invoice_id: int,
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> Invoice:
    inv = db.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    if inv.status != InvoiceStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Invoice is not pending review",
        )
    pkg = db.get(Package, inv.package_id)
    if not pkg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Package not found")

    now = datetime.now(timezone.utc)
    inv.status = InvoiceStatus.approved
    inv.reviewed_at = now
    inv.rejection_reason = None
    pkg.status = PackageStatus.approved
    pkg.updated_at = now
    db.commit()
    db.refresh(inv)
    return inv


@router.patch("/invoices/{invoice_id}/reject", response_model=InvoiceOut)
def reject_invoice(
    invoice_id: int,
    body: RejectBody,
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> Invoice:
    inv = db.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    if inv.status != InvoiceStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Invoice is not pending review",
        )
    pkg = db.get(Package, inv.package_id)
    if not pkg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Package not found")

    now = datetime.now(timezone.utc)
    inv.status = InvoiceStatus.rejected
    inv.rejection_reason = body.rejection_reason.strip()
    inv.reviewed_at = now
    pkg.status = PackageStatus.pending_invoice
    pkg.updated_at = now
    db.commit()
    db.refresh(inv)
    return inv
