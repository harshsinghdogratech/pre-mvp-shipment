from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_admin, require_client
from app.models import Invoice, Package, PackageStatus, User, UserRole
from app.schemas import (
    InvoiceStatusEnum,
    LatestInvoiceInfo,
    PackageCreate,
    PackageOut,
    PackageStatusEnum,
)

router = APIRouter()


def _latest_invoice(db: Session, package_id: int) -> Invoice | None:
    return db.scalars(
        select(Invoice)
        .where(Invoice.package_id == package_id)
        .order_by(Invoice.uploaded_at.desc())
        .limit(1)
    ).first()


def _package_to_out(
    p: Package,
    db: Session,
    *,
    client_name: str | None = None,
    client_email: str | None = None,
) -> PackageOut:
    inv = _latest_invoice(db, p.id)
    latest = None
    if inv:
        latest = LatestInvoiceInfo(
            id=inv.id,
            status=InvoiceStatusEnum(inv.status.value),
            rejection_reason=inv.rejection_reason,
        )
    return PackageOut(
        id=p.id,
        title=p.title,
        description=p.description,
        status=PackageStatusEnum(p.status.value),
        created_by_id=p.created_by_id,
        client_id=p.client_id,
        created_at=p.created_at,
        updated_at=p.updated_at,
        latest_invoice=latest,
        client_name=client_name,
        client_email=client_email,
    )


@router.post("/packages", response_model=PackageOut)
def create_package(
    body: PackageCreate,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> PackageOut:
    client = db.get(User, body.client_id)
    if not client or client.role != UserRole.client:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid client_id",
        )
    pkg = Package(
        title=body.title.strip(),
        description=body.description.strip() if body.description else None,
        status=PackageStatus.pending_invoice,
        created_by_id=admin.id,
        client_id=body.client_id,
    )
    db.add(pkg)
    db.commit()
    db.refresh(pkg)
    return _package_to_out(pkg, db, client_name=client.name, client_email=client.email)


@router.get("/packages", response_model=list[PackageOut])
def list_packages(
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[PackageOut]:
    if current.role == UserRole.admin:
        rows = db.execute(
            select(Package, User)
            .join(User, Package.client_id == User.id)
            .order_by(Package.created_at.desc())
        ).all()
        return [
            _package_to_out(p, db, client_name=u.name, client_email=u.email)
            for p, u in rows
        ]
    rows = db.scalars(
        select(Package)
        .where(Package.client_id == current.id)
        .order_by(Package.created_at.desc())
    ).all()
    return [_package_to_out(p, db) for p in rows]


@router.get("/packages/{package_id}", response_model=PackageOut)
def get_package(
    package_id: int,
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> PackageOut:
    p = db.get(Package, package_id)
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Package not found")
    if current.role == UserRole.client and p.client_id != current.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    client = db.get(User, p.client_id)
    if current.role == UserRole.admin and client:
        return _package_to_out(p, db, client_name=client.name, client_email=client.email)
    return _package_to_out(p, db)


@router.patch("/packages/{package_id}/request-shipment", response_model=PackageOut)
def request_shipment(
    package_id: int,
    client: Annotated[User, Depends(require_client)],
    db: Annotated[Session, Depends(get_db)],
) -> PackageOut:
    p = db.get(Package, package_id)
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Package not found")
    if p.client_id != client.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if p.status != PackageStatus.approved:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Package must be approved before requesting shipment",
        )
    p.status = PackageStatus.shipment_requested
    p.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(p)
    return _package_to_out(p, db)


@router.patch("/packages/{package_id}/ship", response_model=PackageOut)
def mark_shipped(
    package_id: int,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> PackageOut:
    p = db.get(Package, package_id)
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Package not found")
    if p.status != PackageStatus.shipment_requested:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Package must be in shipment_requested status",
        )
    p.status = PackageStatus.shipped
    p.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(p)
    client = db.get(User, p.client_id)
    return _package_to_out(
        p,
        db,
        client_name=client.name if client else None,
        client_email=client.email if client else None,
    )
