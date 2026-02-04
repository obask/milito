"""Initialize database and seed with initial data."""

from datetime import datetime
from uuid import uuid4

from passlib.context import CryptContext

from app.config import get_settings
from app.database import Base, engine, SessionLocal
from app.models import User, Account, Game, Session

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Sample games
SAMPLE_GAMES = [
    {
        "id": "milito",
        "name": "Milito",
        "description": "Ancient tactical card game. Deploy units on a 5-column battlefield to conquer territory!",
        "min_players": 2,
        "max_players": 2,
        "image_url": "⚔️",
    },
]

# Test user
TEST_USER = {
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
}


def create_tables():
    """Create all database tables."""
    print("🏗️  Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully")


def seed_games(db):
    """Seed games if not already present."""
    existing_games = db.query(Game).all()
    if existing_games:
        print("✅ Games already seeded")
        return

    for game_data in SAMPLE_GAMES:
        game = Game(
            id=game_data["id"],
            name=game_data["name"],
            description=game_data["description"],
            min_players=game_data["min_players"],
            max_players=game_data["max_players"],
            image_url=game_data["image_url"],
            created_at=datetime.utcnow(),
        )
        db.add(game)

    db.commit()
    print(f"✅ Seeded {len(SAMPLE_GAMES)} games")


def seed_test_user(db):
    """Seed test user if not already present."""
    existing_user = db.query(User).filter(User.email == TEST_USER["email"]).first()
    if existing_user:
        print("✅ Test user already exists")
        return

    now = datetime.utcnow()
    user_id = str(uuid4())

    # Create user
    user = User(
        id=user_id,
        name=TEST_USER["name"],
        email=TEST_USER["email"],
        email_verified=False,
        created_at=now,
        updated_at=now,
    )
    db.add(user)

    # Create account with hashed password
    account = Account(
        id=str(uuid4()),
        account_id=user_id,
        provider_id="credential",
        user_id=user_id,
        password=pwd_context.hash(TEST_USER["password"]),
        created_at=now,
        updated_at=now,
    )
    db.add(account)

    db.commit()
    print(f"✅ Seeded test user ({TEST_USER['email']} / {TEST_USER['password']})")


def main():
    """Main entry point."""
    print("🌱 Initializing database...")
    print(f"📂 Database URL: {get_settings().sqlite_url}")

    # Create tables
    create_tables()

    # Seed data
    db = SessionLocal()
    try:
        seed_games(db)
        seed_test_user(db)
        print("✅ Database initialization complete")
    finally:
        db.close()


if __name__ == "__main__":
    main()
