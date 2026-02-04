"""Authentication service for user management and session handling."""

import secrets
from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.models.user import Account, Session as SessionModel, User

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Session duration
SESSION_DURATION_DAYS = 7


class AuthService:
    """Authentication service handling user registration, login, and sessions."""

    def __init__(self, db: Session):
        self.db = db

    def _hash_password(self, password: str) -> str:
        """Hash a password using bcrypt."""
        return pwd_context.hash(password)

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return pwd_context.verify(plain_password, hashed_password)

    def _generate_session_token(self) -> str:
        """Generate a secure session token."""
        return secrets.token_urlsafe(32)

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by email address."""
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get a user by ID."""
        return self.db.query(User).filter(User.id == user_id).first()

    def create_user(self, email: str, password: str, name: str) -> User:
        """Create a new user with email/password authentication."""
        user_id = str(uuid4())
        now = datetime.utcnow()

        # Create user
        user = User(
            id=user_id,
            email=email,
            name=name,
            email_verified=False,
            created_at=now,
            updated_at=now,
        )
        self.db.add(user)

        # Create account with hashed password (Better-Auth compatible)
        account = Account(
            id=str(uuid4()),
            account_id=user_id,
            provider_id="credential",
            user_id=user_id,
            password=self._hash_password(password),
            created_at=now,
            updated_at=now,
        )
        self.db.add(account)

        self.db.commit()
        self.db.refresh(user)
        return user

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate a user with email and password."""
        user = self.get_user_by_email(email)
        if not user:
            return None

        # Get the credential account
        account = (
            self.db.query(Account)
            .filter(Account.user_id == user.id, Account.provider_id == "credential")
            .first()
        )
        if not account or not account.password:
            return None

        if not self._verify_password(password, account.password):
            return None

        return user

    def create_session(
        self, user_id: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None
    ) -> SessionModel:
        """Create a new session for a user."""
        now = datetime.utcnow()
        session = SessionModel(
            id=str(uuid4()),
            token=self._generate_session_token(),
            user_id=user_id,
            expires_at=now + timedelta(days=SESSION_DURATION_DAYS),
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=now,
            updated_at=now,
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_session_by_token(self, token: str) -> Optional[SessionModel]:
        """Get a valid session by token."""
        session = self.db.query(SessionModel).filter(SessionModel.token == token).first()
        if not session:
            return None

        # Check if session is expired
        if session.expires_at < datetime.utcnow():
            self.db.delete(session)
            self.db.commit()
            return None

        return session

    def delete_session(self, token: str) -> bool:
        """Delete a session by token."""
        session = self.db.query(SessionModel).filter(SessionModel.token == token).first()
        if session:
            self.db.delete(session)
            self.db.commit()
            return True
        return False

    def delete_expired_sessions(self) -> int:
        """Delete all expired sessions. Returns count of deleted sessions."""
        result = self.db.query(SessionModel).filter(
            SessionModel.expires_at < datetime.utcnow()
        ).delete()
        self.db.commit()
        return result
