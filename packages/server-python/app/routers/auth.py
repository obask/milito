"""Authentication routes."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import (
    SESSION_COOKIE_NAME,
    get_auth_service,
    get_current_user_optional,
    get_session_token,
)
from app.models.user import User
from app.schemas.auth import SessionResponse, UserCreate, UserLogin, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_session_cookie(response: Response, token: str) -> None:
    """Set the session cookie."""
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True in production with HTTPS
        max_age=7 * 24 * 60 * 60,  # 7 days
        path="/",
    )


def _delete_session_cookie(response: Response) -> None:
    """Delete the session cookie."""
    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/")


def _user_to_response(user: User) -> UserResponse:
    """Convert User model to UserResponse."""
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        emailVerified=user.email_verified,
        image=user.image,
        createdAt=user.created_at,
        updatedAt=user.updated_at,
    )


@router.post("/sign-up/email", response_model=UserResponse)
def sign_up(
    user_data: UserCreate,
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    """Register a new user with email and password."""
    # Check if user already exists
    existing_user = auth_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    # Create user
    user = auth_service.create_user(
        email=user_data.email,
        password=user_data.password,
        name=user_data.name,
    )

    # Create session
    session = auth_service.create_session(
        user_id=user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    # Set cookie
    _set_session_cookie(response, session.token)

    return _user_to_response(user)


@router.post("/sign-in/email", response_model=UserResponse)
def sign_in(
    credentials: UserLogin,
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    """Sign in with email and password."""
    user = auth_service.authenticate_user(credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Create session
    session = auth_service.create_session(
        user_id=user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    # Set cookie
    _set_session_cookie(response, session.token)

    return _user_to_response(user)


@router.post("/sign-out")
def sign_out(
    response: Response,
    token: Optional[str] = Depends(get_session_token),
    auth_service: AuthService = Depends(get_auth_service),
) -> dict:
    """Sign out the current user."""
    if token:
        auth_service.delete_session(token)

    _delete_session_cookie(response)
    return {"success": True}


@router.get("/get-session", response_model=SessionResponse)
def get_session(
    user: Optional[User] = Depends(get_current_user_optional),
) -> SessionResponse:
    """Get current session and user."""
    if not user:
        return SessionResponse(session=None, user=None)

    return SessionResponse(
        session={"active": True},
        user=_user_to_response(user),
    )
