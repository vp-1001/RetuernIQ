from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app import models
from backend.app.api.routes.auth import router as auth_router
from backend.app.api.routes.analytics import router as analytics_router
from backend.app.api.routes.reports import router as reports_router
from backend.app.api.routes.evidence import router as evidence_router
from backend.app.api.routes.evidence_ai import router as evidence_ai_router
from backend.app.api.routes.health import router as health_router
from backend.app.api.routes.kpi import router as kpi_router
from backend.app.api.routes.merchant_intelligence import (
    router as merchant_intelligence_router,
)
from backend.app.api.routes.review_history import (
    router as review_history_router,
)
from backend.app.api.routes.merchant_settings import (
    router as merchant_settings_router,
)
from backend.app.api.routes.review import router as review_router
from backend.app.api.routes.returns import router as returns_router
from backend.app.core.storage import (
    UPLOADS_DIR,
    create_storage_directories,
)
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
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Authorization",
        "Content-Type",
        "Origin",
        "X-Requested-With",
    ],
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

app.include_router(
    evidence_ai_router,
    prefix="/api/v1",
)


app.include_router(
    review_router,
    prefix="/api/v1",
)

app.include_router(
    merchant_settings_router,
    prefix="/api/v1",
)


app.include_router(
    analytics_router,
    prefix="/api/v1",
)

app.include_router(
    reports_router,
    prefix="/api/v1",
)

app.include_router(
    kpi_router,
    prefix="/api/v1",
)

app.include_router(
    merchant_intelligence_router,
    prefix="/api/v1",
)

app.include_router(
    review_history_router,
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