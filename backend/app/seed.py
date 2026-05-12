from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth_utils import hash_password
from app.config import settings
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

DEMO_PASSWORD = "password123"
DEMO_ADMIN_EMAIL = "admin@ship2aruba.com"
DEMO_CLIENT_EMAIL = "client@ship2aruba.com"
DEMO_CLIENT_SUITE = "SN-1001"


def _client_suite_for_insert(db: Session) -> str | None:
    taken = db.execute(
        select(User.id).where(User.suite_number == DEMO_CLIENT_SUITE)
    ).scalar_one_or_none()
    return None if taken is not None else DEMO_CLIENT_SUITE


def reconcile_demo_accounts(db: Session) -> None:
    pw = hash_password(DEMO_PASSWORD)
    for email, name, role in (
        (DEMO_ADMIN_EMAIL, "Admin User", UserRole.admin),
        (DEMO_CLIENT_EMAIL, "Client User", UserRole.client),
    ):
        u = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if u is None:
            suite = (
                _client_suite_for_insert(db)
                if role == UserRole.client
                else None
            )
            db.add(
                User(
                    name=name,
                    email=email,
                    password=pw,
                    role=role,
                    suite_number=suite,
                )
            )
        elif settings.sync_demo_login:
            u.password = pw
    db.commit()


def ensure_client_suite_numbers(db: Session) -> None:
    used: set[str] = set()
    for sn in db.scalars(
        select(User.suite_number).where(User.suite_number.is_not(None))
    ).all():
        s = (sn or "").strip()
        if s:
            used.add(s)

    clients = db.scalars(
        select(User).where(User.role == UserRole.client)
    ).all()
    need = [u for u in clients if not (u.suite_number or "").strip()]
    if not need:
        return
    n = 1001
    for u in need:
        while f"SN-{n}" in used:
            n += 1
        cand = f"SN-{n}"
        u.suite_number = cand
        used.add(cand)
        n += 1
    db.commit()


def seed_if_empty(db: Session) -> None:
    if db.execute(select(User).limit(1)).scalar_one_or_none() is not None:
        return

    admin = User(
        name="Admin User",
        email=DEMO_ADMIN_EMAIL,
        password=hash_password(DEMO_PASSWORD),
        role=UserRole.admin,
        suite_number=None,
    )
    client = User(
        name="Client User",
        email=DEMO_CLIENT_EMAIL,
        password=hash_password(DEMO_PASSWORD),
        role=UserRole.client,
        suite_number=DEMO_CLIENT_SUITE,
    )
    db.add_all([admin, client])
    db.flush()

    now = datetime.now(timezone.utc)

    pkg1 = Package(
        tracking_number="TRK-20260501-001",
        width=30.0,
        height=20.0,
        length=40.0,
        weight=2.5,
        contents_description="Electronics — laptop and accessories",
        status=PackageStatus.ready_to_send,
        client_id=client.id,
        date_received=date(2026, 5, 1),
    )

    pkg2 = Package(
        tracking_number="TRK-20260502-002",
        width=25.0,
        height=15.0,
        length=35.0,
        weight=1.8,
        contents_description="Documents bundle — legal paperwork",
        status=PackageStatus.invoice_approved,
        client_id=client.id,
        date_received=date(2026, 5, 2),
    )

    pkg3 = Package(
        tracking_number="TRK-20260503-003",
        width=50.0,
        height=30.0,
        length=60.0,
        weight=5.0,
        contents_description="Clothing — assorted items for resale",
        status=PackageStatus.shipped,
        client_id=client.id,
        date_received=date(2026, 5, 3),
    )

    db.add_all([pkg1, pkg2, pkg3])
    db.flush()

    inv2 = Invoice(
        package_id=pkg2.id,
        file_path="uploads/invoices/seed_invoice_pkg2.pdf",
        file_name="invoice_documents_bundle.pdf",
        review_status=InvoiceReviewStatus.approved,
        admin_notes=None,
        reviewed_at=now,
        reviewed_by=admin.id,
    )

    inv3 = Invoice(
        package_id=pkg3.id,
        file_path="uploads/invoices/seed_invoice_pkg3.pdf",
        file_name="invoice_clothing_items.pdf",
        review_status=InvoiceReviewStatus.approved,
        admin_notes=None,
        reviewed_at=now,
        reviewed_by=admin.id,
    )
    db.add_all([inv2, inv3])
    db.flush()

    sr = ShipRequest(
        client_id=client.id,
        submitted_at=now,
        processing_status=ShipProcessingStatus.shipped,
    )
    db.add(sr)
    db.flush()

    srp = ShipRequestPackage(
        ship_request_id=sr.id,
        package_id=pkg3.id,
    )
    db.add(srp)

    history_entries = [
        StatusHistory(
            package_id=pkg2.id,
            old_status="ready_to_send",
            new_status="pending_invoice_review",
            changed_by_user_id=client.id,
            changed_at=now,
        ),
        StatusHistory(
            package_id=pkg2.id,
            old_status="pending_invoice_review",
            new_status="invoice_approved",
            changed_by_user_id=admin.id,
            changed_at=now,
        ),
        StatusHistory(
            package_id=pkg3.id,
            old_status="ready_to_send",
            new_status="pending_invoice_review",
            changed_by_user_id=client.id,
            changed_at=now,
        ),
        StatusHistory(
            package_id=pkg3.id,
            old_status="pending_invoice_review",
            new_status="invoice_approved",
            changed_by_user_id=admin.id,
            changed_at=now,
        ),
        StatusHistory(
            package_id=pkg3.id,
            old_status="invoice_approved",
            new_status="ship_requested",
            changed_by_user_id=client.id,
            changed_at=now,
        ),
        StatusHistory(
            package_id=pkg3.id,
            old_status="ship_requested",
            new_status="shipped",
            changed_by_user_id=admin.id,
            changed_at=now,
        ),
    ]
    db.add_all(history_entries)

    db.commit()
