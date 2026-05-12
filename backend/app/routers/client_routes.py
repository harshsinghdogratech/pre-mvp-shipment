import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_client
from app.enum_coerce import invoice_review_enum, package_status_enum
from app.exceptions import AppError
from app.models import (
    Invoice,
    InvoiceReviewStatus,
    Package,
    PackageStatus,
    ShipProcessingStatus,
    ShipRequest,
    ShipRequestPackage,
    StatusHistory,
    User,
    UserRole,
)
from app.schemas import (
    ClientDashboard,
    ClientShipmentItem,
    InvoiceInfo,
    InvoiceOut,
    PackageOut,
    ShipProcessingStatusEnum,
    ShipRequestCreate,
    ShipRequestOut,
    ShipRequestPackageOut,
)

router = APIRouter()

ALLOWED_EXTENSIONS = frozenset({"pdf", "png", "jpg", "jpeg"})
MAX_BYTES = 10 * 1024 * 1024


def _uploads_dir() -> Path:
    base = Path(__file__).resolve().parent.parent.parent
    d = base / "uploads" / "invoices"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _abs_path(relative: str) -> Path:
    base = Path(__file__).resolve().parent.parent.parent
    return (base / relative).resolve()


def _ext(filename: str) -> str:
    if "." not in filename:
        return ""
    return filename.rsplit(".", 1)[-1].lower()


def _invoice_info(inv: Invoice | None) -> InvoiceInfo | None:
    if not inv:
        return None
    return InvoiceInfo(
        id=inv.id,
        review_status=invoice_review_enum(inv.review_status.value),
        admin_notes=inv.admin_notes,
        file_name=inv.file_name,
        uploaded_at=inv.uploaded_at,
    )


def _pkg_to_out(p: Package) -> PackageOut:
    return PackageOut(
        id=p.id,
        tracking_number=p.tracking_number,
        width=p.width,
        height=p.height,
        length=p.length,
        weight=p.weight,
        contents_description=p.contents_description,
        status=package_status_enum(p.status.value),
        client_id=p.client_id,
        date_received=p.date_received,
        created_at=p.created_at,
        updated_at=p.updated_at,
        invoice=_invoice_info(p.invoice),
    )


def _record_transition(
    db: Session,
    pkg: Package,
    old: str,
    new: str,
    user_id: int,
) -> None:
    db.add(
        StatusHistory(
            package_id=pkg.id,
            old_status=old,
            new_status=new,
            changed_by_user_id=user_id,
            changed_at=datetime.now(timezone.utc),
        )
    )


def _sr_to_out(sr: ShipRequest, db: Session) -> ShipRequestOut:
    links = db.scalars(
        select(ShipRequestPackage).where(
            ShipRequestPackage.ship_request_id == sr.id
        )
    ).all()
    pkg_outs = []
    for link in links:
        pkg = db.get(Package, link.package_id)
        pkg_outs.append(
            ShipRequestPackageOut(
                id=link.id,
                package_id=link.package_id,
                tracking_number=pkg.tracking_number if pkg else None,
                contents_description=(
                    pkg.contents_description if pkg else None
                ),
                status=(
                    package_status_enum(pkg.status.value) if pkg else None
                ),
            )
        )
    return ShipRequestOut(
        id=sr.id,
        client_id=sr.client_id,
        submitted_at=sr.submitted_at,
        processing_status=ShipProcessingStatusEnum(
            sr.processing_status.value
        ),
        packages=pkg_outs,
    )


@router.get("/dashboard", response_model=ClientDashboard)
def client_dashboard(
    client: Annotated[User, Depends(require_client)],
    db: Annotated[Session, Depends(get_db)],
) -> ClientDashboard:
    def _c(s: PackageStatus) -> int:
        return int(
            db.scalar(
                select(func.count())
                .select_from(Package)
                .where(
                    Package.client_id == client.id,
                    Package.status == s,
                )
            )
            or 0
        )

    return ClientDashboard(
        ready_to_send=_c(PackageStatus.ready_to_send),
        pending_invoice_review=_c(
            PackageStatus.pending_invoice_review
        ),
        invoice_needs_review=_c(PackageStatus.invoice_needs_review),
        invoice_approved=_c(PackageStatus.invoice_approved),
        ship_requested=_c(PackageStatus.ship_requested),
        shipped=_c(PackageStatus.shipped),
        ready_for_pickup=_c(PackageStatus.ready_for_pickup),
        delivered=_c(PackageStatus.delivered),
    )


@router.get("/packages", response_model=list[PackageOut])
def list_my_packages(
    client: Annotated[User, Depends(require_client)],
    db: Annotated[Session, Depends(get_db)],
) -> list[PackageOut]:
    pkgs = db.scalars(
        select(Package)
        .where(Package.client_id == client.id)
        .order_by(Package.created_at.desc())
    ).all()
    return [_pkg_to_out(p) for p in pkgs]


@router.get("/packages/{package_id}", response_model=PackageOut)
def get_my_package(
    package_id: int,
    client: Annotated[User, Depends(require_client)],
    db: Annotated[Session, Depends(get_db)],
) -> PackageOut:
    p = db.get(Package, package_id)
    if not p:
        raise AppError(404, "Package not found", "NOT_FOUND")
    if p.client_id != client.id:
        raise AppError(403, "Forbidden", "FORBIDDEN")
    return _pkg_to_out(p)


@router.post(
    "/packages/{package_id}/invoice", response_model=InvoiceOut
)
async def upload_invoice(
    package_id: int,
    invoice: UploadFile = File(...),
    client: User = Depends(require_client),
    db: Session = Depends(get_db),
) -> Invoice:
    pkg = db.get(Package, package_id)
    if not pkg:
        raise AppError(404, "Package not found", "NOT_FOUND")
    if pkg.client_id != client.id:
        raise AppError(403, "Forbidden", "FORBIDDEN")
    if pkg.status not in (
        PackageStatus.ready_to_send,
        PackageStatus.invoice_needs_review,
    ):
        raise AppError(
            409,
            "Invoice upload only allowed when package status is "
            "'ready_to_send' or 'invoice_needs_review'",
            "INVALID_STATUS",
        )

    original = invoice.filename or "upload"
    ext = _ext(original)
    if ext not in ALLOWED_EXTENSIONS:
        raise AppError(
            422,
            f"File type '{ext}' not allowed. "
            f"Accepted: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            "INVALID_FILE_TYPE",
        )

    body = await invoice.read()
    if len(body) > MAX_BYTES:
        raise AppError(422, "File exceeds 10 MB limit", "FILE_TOO_LARGE")

    stored = f"{uuid.uuid4().hex}.{ext}"
    rel_path = f"uploads/invoices/{stored}"
    dest = _uploads_dir() / stored
    dest.write_bytes(body)

    existing = db.scalars(
        select(Invoice).where(Invoice.package_id == pkg.id)
    ).first()
    if existing:
        db.delete(existing)
        db.flush()

    inv = Invoice(
        package_id=pkg.id,
        file_path=rel_path,
        file_name=original,
        review_status=InvoiceReviewStatus.pending,
        admin_notes=None,
        reviewed_at=None,
        reviewed_by=None,
    )

    old = pkg.status.value
    pkg.status = PackageStatus.pending_invoice_review
    pkg.updated_at = datetime.now(timezone.utc)
    _record_transition(db, pkg, old, pkg.status.value, client.id)

    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv


@router.get("/packages/{package_id}/invoice/file")
def get_invoice_file(
    package_id: int,
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> FileResponse:
    pkg = db.get(Package, package_id)
    if not pkg:
        raise AppError(404, "Package not found", "NOT_FOUND")
    if (
        current.role == UserRole.client
        and pkg.client_id != current.id
    ):
        raise AppError(403, "Forbidden", "FORBIDDEN")

    inv = db.scalars(
        select(Invoice).where(Invoice.package_id == pkg.id)
    ).first()
    if not inv:
        raise AppError(404, "No invoice for this package", "NOT_FOUND")

    path = _abs_path(inv.file_path)
    if not path.is_file():
        raise AppError(404, "File missing on server", "FILE_MISSING")

    ext = _ext(inv.file_name)
    media = "application/octet-stream"
    if ext == "pdf":
        media = "application/pdf"
    elif ext in {"png", "jpg", "jpeg"}:
        media = f"image/{'jpeg' if ext in {'jpg', 'jpeg'} else ext}"
    return FileResponse(path, media_type=media, filename=inv.file_name)


@router.post("/ship-requests", response_model=ShipRequestOut)
def create_ship_request(
    body: ShipRequestCreate,
    client: Annotated[User, Depends(require_client)],
    db: Annotated[Session, Depends(get_db)],
) -> ShipRequestOut:
    packages: list[Package] = []
    for pid in body.package_ids:
        pkg = db.get(Package, pid)
        if not pkg:
            raise AppError(
                404, f"Package {pid} not found", "NOT_FOUND"
            )
        if pkg.client_id != client.id:
            raise AppError(
                403,
                f"Package {pid} does not belong to you",
                "FORBIDDEN",
            )
        if pkg.status != PackageStatus.invoice_approved:
            raise AppError(
                409,
                f"Package {pid} must be 'invoice_approved' "
                f"(current: {pkg.status.value})",
                "INVALID_STATUS",
            )
        packages.append(pkg)

    now = datetime.now(timezone.utc)
    sr = ShipRequest(
        client_id=client.id,
        submitted_at=now,
        processing_status=ShipProcessingStatus.pending,
    )
    db.add(sr)
    db.flush()

    for pkg in packages:
        db.add(
            ShipRequestPackage(
                ship_request_id=sr.id,
                package_id=pkg.id,
            )
        )
        old = pkg.status.value
        pkg.status = PackageStatus.ship_requested
        pkg.updated_at = now
        _record_transition(db, pkg, old, pkg.status.value, client.id)

    db.commit()
    db.refresh(sr)
    return _sr_to_out(sr, db)


@router.get(
    "/shipments", response_model=list[ClientShipmentItem]
)
def list_my_shipments(
    client: Annotated[User, Depends(require_client)],
    db: Annotated[Session, Depends(get_db)],
) -> list[ClientShipmentItem]:
    pkgs = db.scalars(
        select(Package).where(
            Package.client_id == client.id,
            Package.status.in_(
                [
                    PackageStatus.shipped,
                    PackageStatus.ready_for_pickup,
                    PackageStatus.delivered,
                ]
            ),
        )
        .order_by(Package.updated_at.desc())
    ).all()
    return [
        ClientShipmentItem(
            id=p.id,
            tracking_number=p.tracking_number,
            contents_description=p.contents_description,
            status=package_status_enum(p.status.value),
            updated_at=p.updated_at,
        )
        for p in pkgs
    ]
