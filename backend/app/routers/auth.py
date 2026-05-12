from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth_utils import create_access_token, verify_password
from app.database import get_db
from app.deps import blacklist_token, get_current_user
from app.exceptions import AppError
from app.models import User
from app.schemas import LoginRequest, LoginResponse, UserPublic

router = APIRouter()
_security = HTTPBearer(auto_error=False)


@router.post("/login", response_model=LoginResponse)
def login(
    body: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
) -> LoginResponse:
    user = db.execute(
        select(User).where(User.email == body.email)
    ).scalar_one_or_none()
    if not user or not verify_password(body.password, user.password):
        raise AppError(
            401, "Invalid email or password", "INVALID_CREDENTIALS"
        )
    token = create_access_token(str(user.id), user.role.value)
    return LoginResponse(
        access_token=token,
        user=UserPublic.model_validate(user),
    )


@router.post("/logout")
def logout(
    _: Annotated[User, Depends(get_current_user)],
    creds: Annotated[
        HTTPAuthorizationCredentials | None, Depends(_security)
    ],
) -> dict[str, str]:
    if creds and creds.credentials:
        blacklist_token(creds.credentials)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserPublic)
def me(
    current: Annotated[User, Depends(get_current_user)],
) -> User:
    return current
