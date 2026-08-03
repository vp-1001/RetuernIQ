from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.api.dependencies import require_roles
from backend.app.database.session import get_db
from backend.app.models.user_model import User
from backend.app.schemas.analytics_schema import (
    AnalyticsDashboard,
)
from backend.app.services.analytics_service import (
    build_dashboard,
)


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


@router.get(
    "/dashboard",
    response_model=AnalyticsDashboard,
)
def analytics_dashboard(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "merchant",
            "reviewer",
        )
    ),
) -> AnalyticsDashboard:
    return build_dashboard(
        db,
        start_date=start_date,
        end_date=end_date,
    )
