from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.api.routes.returns import router as returns_router


app = FastAPI(
    title="ReturnIQ API",
    version="1.0.0",
    description="Return decision intelligence platform for e-commerce businesses."
)

app.include_router(
    health_router,
    prefix="/api/v1"
)

app.include_router(
    returns_router,
    prefix="/api/v1"
)


@app.get("/")
def root():
    return {
        "name": "ReturnIQ API",
        "version": "1.0.0",
        "documentation": "/docs"
    }