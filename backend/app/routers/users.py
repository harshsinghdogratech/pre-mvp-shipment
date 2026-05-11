from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin
from app.models import User, UserRole
from app.schemas import ClientUserOut

router = APIRouter()


@router.get("/clients", response_model=list[ClientUserOut])
def list_clients(
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> list[User]:
    rows = db.execute(
        select(User).where(User.role == UserRole.client).order_by(User.name)
    ).scalars().all()
    return list(rows)
