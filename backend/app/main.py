from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.returns import router as returns_router
from app.database.base import Base
from app.database.session import engine


Base.metadata.create_all(bind=engine)


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


@app.get("/")
def root():
    return {
        "name": "ReturnIQ API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }