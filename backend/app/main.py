from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.api.routes.returns import router as returns_router
from app.database.base import Base
from app.database.session import engine
from app.models import ReturnRequest


app = FastAPI(
    title="ReturnIQ API",
    description="API-first Return Decision Intelligence Platform",
    version="1.0.0",
)


Base.metadata.create_all(bind=engine)


app.include_router(
    health_router,
    prefix="/api/v1",
    tags=["Health"],
)

app.include_router(
    returns_router,
    prefix="/api/v1",
    tags=["Returns"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": "Welcome to ReturnIQ API",
        "docs": "/docs",
    }