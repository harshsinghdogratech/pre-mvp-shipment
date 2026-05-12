from datetime import date, datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin
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
    VALID_TRANSITIONS,
)
from app.schemas import (
    AdminClientDetail,
    AdminClientListItem,
    AdminDashboard,
    FinalStatusBody,
    InvoiceInfo,
    InvoiceOut,
    InvoicePendingRow,
    NeedsReviewBody,
    PackageCreate,
    PackageDetail,
    PackageOut,
    PackageStatusEnum,
    ShipProcessingStatusEnum,
    ShipRequestOut,
    ShipRequestPackageOut,
    StatusHistoryItem,
)

from app.seed import ensure_client_suite_numbers

router = APIRouter()


def _record_transition(
    db: Session,
    pkg: Package,
    old_status: str,
    new_status: str,
    user_id: int,
) -> None:
    db.add(
        StatusHistory(
            package_id=pkg.id,
            old_status=old_status,
            new_status=new_status,
            changed_by_user_id=user_id,
            changed_at=datetime.now(timezone.utc),
        )
    )


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


def _pkg_to_out(
    p: Package,
    *,
    client_name: str | None = None,
    client_email: str | None = None,
    client_suite: str | None = None,
) -> PackageOut:
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
        client_name=client_name,
        client_email=client_email,
        client_suite=client_suite,
        invoice=_invoice_info(p.invoice),
    )


def _sr_to_out(
    sr: ShipRequest,
    db: Session,
    *,
    client_name: str | None = None,
    client_email: str | None = None,
) -> ShipRequestOut:
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
        client_name=client_name,
        client_email=client_email,
        submitted_at=sr.submitted_at,
        processing_status=ShipProcessingStatusEnum(
            sr.processing_status.value
        ),
        packages=pkg_outs,
    )


@router.get("/dashboard", response_model=AdminDashboard)
def admin_dashboard(
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> AdminDashboard:
    def _count_status(s: PackageStatus) -> int:
        return int(
            db.scalar(
                select(func.count())
                .select_from(Package)
                .where(Package.status == s)
            )
            or 0
        )

    total_clients = int(
        db.scalar(
            select(func.count())
            .select_from(User)
            .where(User.role == UserRole.client)
        )
        or 0
    )
    pending_inv = int(
        db.scalar(
            select(func.count())
            .select_from(Invoice)
            .where(Invoice.review_status == InvoiceReviewStatus.pending)
        )
        or 0
    )
    return AdminDashboard(
        ready_to_send=_count_status(PackageStatus.ready_to_send),
        pending_invoice_review=_count_status(
            PackageStatus.pending_invoice_review
        ),
        invoice_approved=_count_status(PackageStatus.invoice_approved),
        ship_requested=_count_status(PackageStatus.ship_requested),
        shipped=_count_status(PackageStatus.shipped),
        ready_for_pickup=_count_status(PackageStatus.ready_for_pickup),
        delivered=_count_status(PackageStatus.delivered),
        total_clients=total_clients,
        pending_invoice_count=pending_inv,
    )


@router.post("/packages", response_model=PackageOut)
def create_package(
    body: PackageCreate,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> PackageOut:
    client = db.get(User, body.client_id)
    if not client or client.role != UserRole.client:
        raise AppError(422, "Invalid client_id", "INVALID_CLIENT")
    existing = db.scalars(
        select(Package).where(
            Package.tracking_number == body.tracking_number
        )
    ).first()
    if existing:
        raise AppError(
            409, "Tracking number already exists", "DUPLICATE_TRACKING"
        )

    pkg = Package(
        tracking_number=body.tracking_number.strip(),
        width=body.width,
        height=body.height,
        length=body.length,
        weight=body.weight,
        contents_description=body.contents_description.strip(),
        status=PackageStatus.ready_to_send,
        client_id=body.client_id,
        date_received=body.date_received or date.today(),
    )
    db.add(pkg)
    db.flush()

    db.add(
        StatusHistory(
            package_id=pkg.id,
            old_status="",
            new_status=PackageStatus.ready_to_send.value,
            changed_by_user_id=admin.id,
            changed_at=datetime.now(timezone.utc),
        )
    )
    db.commit()
    db.refresh(pkg)
    return _pkg_to_out(
        pkg,
        client_name=client.name,
        client_email=client.email,
        client_suite=client.suite_number,
    )


@router.get("/packages", response_model=list[PackageOut])
def list_packages(
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
    search: str | None = Query(default=None),
    sort_by: str | None = Query(default=None),
) -> list[PackageOut]:
    q = (
        select(Package, User)
        .join(User, Package.client_id == User.id)
    )

    if search:
        term = f"%{search}%"
        q = q.where(
            or_(
                Package.tracking_number.ilike(term),
                Package.contents_description.ilike(term),
            )
        )

    if sort_by == "status":
        q = q.order_by(Package.status)
    elif sort_by == "client":
        q = q.order_by(User.name)
    elif sort_by == "date_received":
        q = q.order_by(Package.date_received.desc())
    else:
        q = q.order_by(Package.created_at.desc())

    rows = db.execute(q).all()
    return [
        _pkg_to_out(
            p,
            client_name=u.name,
            client_email=u.email,
            client_suite=u.suite_number,
        )
        for p, u in rows
    ]


@router.get("/packages/{package_id}", response_model=PackageDetail)
def get_package_detail(
    package_id: int,
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> PackageDetail:
    p = db.get(Package, package_id)
    if not p:
        raise AppError(404, "Package not found", "NOT_FOUND")
    client = db.get(User, p.client_id)

    hist_rows = db.execute(
        select(StatusHistory, User)
        .join(User, StatusHistory.changed_by_user_id == User.id)
        .where(StatusHistory.package_id == package_id)
        .order_by(StatusHistory.changed_at.asc())
    ).all()
    history = [
        StatusHistoryItem(
            id=h.id,
            old_status=h.old_status,
            new_status=h.new_status,
            changed_at=h.changed_at,
            changed_by_name=u.name,
        )
        for h, u in hist_rows
    ]

    base = _pkg_to_out(
        p,
        client_name=client.name if client else None,
        client_email=client.email if client else None,
        client_suite=client.suite_number if client else None,
    )
    return PackageDetail(**base.model_dump(), status_history=history)


@router.get(
    "/invoices/pending", response_model=list[InvoicePendingRow]
)
def list_pending_invoices(
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> list[InvoicePendingRow]:
    rows = db.execute(
        select(Invoice, Package, User)
        .join(Package, Invoice.package_id == Package.id)
        .join(User, Package.client_id == User.id)
        .where(Invoice.review_status == InvoiceReviewStatus.pending)
        .order_by(Invoice.uploaded_at.asc())
    ).all()
    return [
        InvoicePendingRow(
            id=inv.id,
            package_id=pkg.id,
            package_tracking=pkg.tracking_number,
            contents_description=pkg.contents_description,
            client_name=usr.name,
            client_email=usr.email,
            client_suite=usr.suite_number,
            file_name=inv.file_name,
            file_path=inv.file_path,
            uploaded_at=inv.uploaded_at,
        )
        for inv, pkg, usr in rows
    ]


@router.patch(
    "/invoices/{invoice_id}/approve", response_model=InvoiceOut
)
def approve_invoice(
    invoice_id: int,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> Invoice:
    inv = db.get(Invoice, invoice_id)
    if not inv:
        raise AppError(404, "Invoice not found", "NOT_FOUND")
    if inv.review_status != InvoiceReviewStatus.pending:
        raise AppError(
            409, "Invoice is not pending review", "INVALID_STATUS"
        )
    pkg = db.get(Package, inv.package_id)
    if not pkg:
        raise AppError(404, "Package not found", "NOT_FOUND")

    now = datetime.now(timezone.utc)
    inv.review_status = InvoiceReviewStatus.approved
    inv.reviewed_at = now
    inv.reviewed_by = admin.id
    inv.admin_notes = None

    old = pkg.status.value
    pkg.status = PackageStatus.invoice_approved
    pkg.updated_at = now
    _record_transition(db, pkg, old, pkg.status.value, admin.id)

    db.commit()
    db.refresh(inv)
    return inv


@router.patch(
    "/invoices/{invoice_id}/needs-review", response_model=InvoiceOut
)
def needs_review_invoice(
    invoice_id: int,
    body: NeedsReviewBody,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> Invoice:
    inv = db.get(Invoice, invoice_id)
    if not inv:
        raise AppError(404, "Invoice not found", "NOT_FOUND")
    if inv.review_status != InvoiceReviewStatus.pending:
        raise AppError(
            409, "Invoice is not pending review", "INVALID_STATUS"
        )
    pkg = db.get(Package, inv.package_id)
    if not pkg:
        raise AppError(404, "Package not found", "NOT_FOUND")

    now = datetime.now(timezone.utc)
    inv.review_status = InvoiceReviewStatus.needs_review
    inv.admin_notes = body.admin_notes.strip()
    inv.reviewed_at = now
    inv.reviewed_by = admin.id

    old = pkg.status.value
    pkg.status = PackageStatus.ready_to_send
    pkg.updated_at = now
    _record_transition(db, pkg, old, pkg.status.value, admin.id)

    db.commit()
    db.refresh(inv)
    return inv


@router.get(
    "/ship-requests", response_model=list[ShipRequestOut]
)
def list_ship_requests(
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> list[ShipRequestOut]:
    rows = db.execute(
        select(ShipRequest, User)
        .join(User, ShipRequest.client_id == User.id)
        .order_by(ShipRequest.submitted_at.desc())
    ).all()
    return [
        _sr_to_out(sr, db, client_name=u.name, client_email=u.email)
        for sr, u in rows
    ]


@router.patch(
    "/ship-requests/{request_id}/mark-shipped",
    response_model=ShipRequestOut,
)
def mark_ship_request_shipped(
    request_id: int,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> ShipRequestOut:
    sr = db.get(ShipRequest, request_id)
    if not sr:
        raise AppError(404, "Ship request not found", "NOT_FOUND")
    if sr.processing_status != ShipProcessingStatus.pending:
        raise AppError(
            409, "Ship request already processed", "ALREADY_PROCESSED"
        )

    now = datetime.now(timezone.utc)
    sr.processing_status = ShipProcessingStatus.shipped

    links = db.scalars(
        select(ShipRequestPackage).where(
            ShipRequestPackage.ship_request_id == sr.id
        )
    ).all()
    for link in links:
        pkg = db.get(Package, link.package_id)
        if pkg and pkg.status == PackageStatus.ship_requested:
            old = pkg.status.value
            pkg.status = PackageStatus.shipped
            pkg.updated_at = now
            _record_transition(db, pkg, old, pkg.status.value, admin.id)

    db.commit()
    db.refresh(sr)
    client = db.get(User, sr.client_id)
    return _sr_to_out(
        sr,
        db,
        client_name=client.name if client else None,
        client_email=client.email if client else None,
    )


@router.patch(
    "/packages/{package_id}/final-status",
    response_model=PackageOut,
)
def set_final_status(
    package_id: int,
    body: FinalStatusBody,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> PackageOut:
    try:
        body.validate_final()
    except ValueError as e:
        raise AppError(422, str(e), "INVALID_STATUS")

    p = db.get(Package, package_id)
    if not p:
        raise AppError(404, "Package not found", "NOT_FOUND")

    new_status = PackageStatus(body.status.value)
    allowed = VALID_TRANSITIONS.get(p.status, [])
    if new_status not in allowed:
        raise AppError(
            409,
            f"Cannot transition from {p.status.value} to "
            f"{new_status.value}",
            "INVALID_TRANSITION",
        )

    now = datetime.now(timezone.utc)
    old = p.status.value
    p.status = new_status
    p.updated_at = now
    _record_transition(db, p, old, p.status.value, admin.id)

    db.commit()
    db.refresh(p)
    client = db.get(User, p.client_id)
    return _pkg_to_out(
        p,
        client_name=client.name if client else None,
        client_email=client.email if client else None,
        client_suite=client.suite_number if client else None,
    )


@router.get("/clients", response_model=list[AdminClientListItem])
def list_clients(
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> list[AdminClientListItem]:
    ensure_client_suite_numbers(db)
    rows = db.execute(
        select(
            User,
            func.count(Package.id).label("pkg_count"),
        )
        .outerjoin(Package, Package.client_id == User.id)
        .where(User.role == UserRole.client)
        .group_by(User.id)
        .order_by(User.name)
    ).all()
    return [
        AdminClientListItem(
            id=u.id,
            name=u.name,
            email=u.email,
            suite_number=u.suite_number,
            package_count=int(cnt),
        )
        for u, cnt in rows
    ]


@router.get(
    "/clients/{client_id}", response_model=AdminClientDetail
)
def get_client_detail(
    client_id: int,
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> AdminClientDetail:
    client = db.get(User, client_id)
    if not client or client.role != UserRole.client:
        raise AppError(404, "Client not found", "NOT_FOUND")

    pkgs = db.scalars(
        select(Package)
        .where(Package.client_id == client_id)
        .order_by(Package.created_at.desc())
    ).all()

    return AdminClientDetail(
        id=client.id,
        name=client.name,
        email=client.email,
        suite_number=client.suite_number,
        packages=[
            _pkg_to_out(
                p,
                client_name=client.name,
                client_email=client.email,
                client_suite=client.suite_number,
            )
            for p in pkgs
        ],
    )
