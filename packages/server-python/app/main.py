"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from app.config import get_settings
from app.routers import auth_router, games_router, gameplay_router, milito_router

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="Milito Arena API",
    description="Backend API for Milito Arena board game platform",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.client_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(games_router, prefix="/api")
app.include_router(gameplay_router, prefix="/api")
app.include_router(milito_router, prefix="/api")


@app.get("/")
def root() -> dict:
    """Root endpoint."""
    return {
        "name": "Milito Arena API",
        "version": "0.1.0",
        "docs": "/api/docs",
    }


@app.get("/health")
def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "healthy"}


def custom_openapi() -> dict:
    """Generate custom OpenAPI schema."""
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Milito Arena API",
        version="0.1.0",
        description="Backend API for Milito Arena board game platform",
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi  # type: ignore


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.is_development,
    )
