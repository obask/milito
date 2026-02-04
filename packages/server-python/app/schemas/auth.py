"""Auth request/response schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    """Request schema for user registration."""

    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    """Request schema for user login."""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Response schema for user data."""

    id: str
    name: str
    email: str
    emailVerified: bool
    image: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class SessionResponse(BaseModel):
    """Response schema for session with user."""

    session: Optional[dict] = None
    user: Optional[UserResponse] = None
