from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import (
    Invoice,
    InvoiceStatus,
    Package,
    PackageStatus,
    User,
    UserRole,
)
from app.schemas import StatsAdmin, StatsClient

router = APIRouter()


@router.get("/stats", response_model=StatsAdmin | StatsClient)
def get_stats(
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> StatsAdmin | StatsClient:
    if current.role == UserRole.admin:
        total = db.scalar(select(func.count()).select_from(Package)) or 0
        pending_reviews = db.scalar(
            select(func.count()).select_from(Invoice).where(
                Invoice.status == InvoiceStatus.pending
            )
        ) or 0
        shipment_requests = db.scalar(
            select(func.count()).select_from(Package).where(
                Package.status == PackageStatus.shipment_requested
            )
        ) or 0
        shipped = db.scalar(
            select(func.count()).select_from(Package).where(
                Package.status == PackageStatus.shipped
            )
        ) or 0
        return StatsAdmin(
            total_packages=int(total),
            pending_reviews=int(pending_reviews),
            shipment_requests=int(shipment_requests),
            shipped_packages=int(shipped),
        )

    cid = current.id
    total = db.scalar(
        select(func.count()).select_from(Package).where(Package.client_id == cid)
    ) or 0
    pending_uploads = db.scalar(
        select(func.count())
        .select_from(Package)
        .where(
            Package.client_id == cid,
            Package.status == PackageStatus.pending_invoice,
        )
    ) or 0
    approved = db.scalar(
        select(func.count())
        .select_from(Package)
        .where(
            Package.client_id == cid,
            Package.status == PackageStatus.approved,
        )
    ) or 0
    shipped = db.scalar(
        select(func.count())
        .select_from(Package)
        .where(
            Package.client_id == cid,
            Package.status == PackageStatus.shipped,
        )
    ) or 0
    return StatsClient(
        total_packages=int(total),
        pending_uploads=int(pending_uploads),
        approved_packages=int(approved),
        shipped_packages=int(shipped),
    )
