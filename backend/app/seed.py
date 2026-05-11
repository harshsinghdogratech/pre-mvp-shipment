from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth_utils import hash_password
from app.models import Package, PackageStatus, User, UserRole


def seed_if_empty(db: Session) -> None:
    if db.execute(select(User).limit(1)).scalar_one_or_none() is not None:
        return

    admin = User(
        name="Admin User",
        email="admin@test.com",
        password=hash_password("password"),
        role=UserRole.admin,
    )
    client = User(
        name="Client User",
        email="client@test.com",
        password=hash_password("password"),
        role=UserRole.client,
    )
    db.add_all([admin, client])
    db.flush()

    pkgs = [
        Package(
            title="Demo Electronics Shipment",
            description="Sample package awaiting invoice upload.",
            status=PackageStatus.pending_invoice,
            created_by_id=admin.id,
            client_id=client.id,
        ),
        Package(
            title="Demo Documents Bundle",
            description="Second demo package for the client dashboard.",
            status=PackageStatus.pending_invoice,
            created_by_id=admin.id,
            client_id=client.id,
        ),
    ]
    db.add_all(pkgs)
    db.commit()
