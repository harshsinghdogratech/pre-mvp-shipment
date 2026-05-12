from typing import Annotated

from fastapi import Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth_utils import decode_token
from app.database import get_db
from app.exceptions import AppError
from app.models import User, UserRole

security = HTTPBearer(auto_error=False)

_token_blacklist: set[str] = set()


def blacklist_token(token: str) -> None:
    _token_blacklist.add(token)


def is_blacklisted(token: str) -> bool:
    return token in _token_blacklist


def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    creds: Annotated[
        HTTPAuthorizationCredentials | None, Depends(security)
    ],
    token_param: Annotated[str | None, Query(alias="token")] = None,
) -> User:
    token_str = None
    if creds and creds.scheme.lower() == "bearer":
        token_str = creds.credentials
    elif token_param:
        token_str = token_param

    if not token_str:
        raise AppError(401, "Not authenticated", "AUTH_REQUIRED")
    if is_blacklisted(token_str):
        raise AppError(401, "Token has been invalidated", "TOKEN_REVOKED")

    payload = decode_token(token_str)
    if not payload or "sub" not in payload:
        raise AppError(401, "Invalid or expired token", "INVALID_TOKEN")
    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        raise AppError(401, "Invalid token subject", "INVALID_TOKEN")
    user = db.get(User, user_id)
    if not user:
        raise AppError(401, "User not found", "USER_NOT_FOUND")
    return user


def require_admin(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if user.role != UserRole.admin:
        raise AppError(403, "Admin access required", "FORBIDDEN")
    return user


def require_client(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if user.role != UserRole.client:
        raise AppError(403, "Client access required", "FORBIDDEN")
    return user
