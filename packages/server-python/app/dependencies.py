"""FastAPI dependencies for auth and database."""

from typing import Optional

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.auth_service import AuthService

# Cookie name compatible with Better-Auth
SESSION_COOKIE_NAME = "better-auth.session_token"


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """Get an instance of AuthService."""
    return AuthService(db)


def get_session_token(
    session_token: Optional[str] = Cookie(None, alias="better-auth.session_token")
) -> Optional[str]:
    """Extract session token from cookie."""
    return session_token


def get_current_user_optional(
    token: Optional[str] = Depends(get_session_token),
    auth_service: AuthService = Depends(get_auth_service),
) -> Optional[User]:
    """Get current user if authenticated, None otherwise."""
    if not token:
        return None

    session = auth_service.get_session_by_token(token)
    if not session:
        return None

    return auth_service.get_user_by_id(session.user_id)


def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    """Get current user, raise 401 if not authenticated."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return user
