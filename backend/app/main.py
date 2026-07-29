from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app import models
from backend.app.api.routes.auth import router as auth_router
from backend.app.api.routes.evidence import router as evidence_router
from backend.app.api.routes.health import router as health_router
from backend.app.api.routes.returns import router as returns_router
from backend.app.core.storage import UPLOADS_DIR, create_storage_directories
from backend.app.database.base import Base
from backend.app.database.session import engine


Base.metadata.create_all(bind=engine)
create_storage_directories()


app = FastAPI(
    title="ReturnIQ API",
    description="API-first Return Decision Intelligence Platform",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount(
    "/uploads",
    StaticFiles(directory=str(UPLOADS_DIR)),
    name="uploads",
)


app.include_router(
    health_router,
    prefix="/api/v1",
)

app.include_router(
    auth_router,
    prefix="/api/v1",
)

app.include_router(
    returns_router,
    prefix="/api/v1",
)

app.include_router(
    evidence_router,
    prefix="/api/v1",
)


@app.get("/")
def root():
    return {
        "name": "ReturnIQ API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }