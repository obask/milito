# Milito Arena - FastAPI Backend

FastAPI backend for the Milito Arena board game platform.

## Setup

1. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Initialize database and seed data:
```bash
python create_tables.py
```

## Running

Development mode (with auto-reload):
```bash
uvicorn app.main:app --reload --port 3001
```

Production mode:
```bash
uvicorn app.main:app --port 3001
```

## API Documentation

When the server is running:
- Swagger UI: http://localhost:3001/api/docs
- ReDoc: http://localhost:3001/api/redoc
- OpenAPI JSON: http://localhost:3001/api/openapi.json

## Test Credentials

- Email: test@example.com
- Password: password123

## Environment Variables

Copy `.env.example` to `.env`:
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=./dev.db
CLIENT_URL=http://localhost:5173
BETTER_AUTH_SECRET=your-secret-key-minimum-32-chars
```

## API Endpoints

### Auth
- `POST /api/auth/sign-up/email` - Register new user
- `POST /api/auth/sign-in/email` - Login
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/get-session` - Get current session

### Games
- `GET /api/games` - List all games
- `GET /api/games/{gameId}` - Get game by ID
- `GET /api/games/rooms` - List rooms (optional: ?gameId=&status=)
- `GET /api/games/rooms/{roomId}` - Get room details
- `POST /api/games/rooms` - Create room (auth required)
- `POST /api/games/rooms/{roomId}/join` - Join room
- `POST /api/games/rooms/{roomId}/leave` - Leave room
- `POST /api/games/rooms/{roomId}/start` - Start game (host only)

### Memory Match Gameplay
- `GET /api/gameplay/{roomId}/state` - Get game state
- `POST /api/gameplay/{roomId}/initialize` - Initialize game
- `POST /api/gameplay/{roomId}/flip` - Flip a card
- `POST /api/gameplay/{roomId}/reset` - Reset flipped cards

### Milito Gameplay
- `GET /api/milito/{roomId}/state` - Get game state
- `POST /api/milito/{roomId}/initialize` - Initialize game
- `POST /api/milito/{roomId}/select-card` - Select card from hand
- `POST /api/milito/{roomId}/select-column` - Select column
- `POST /api/milito/{roomId}/discard` - Discard card
