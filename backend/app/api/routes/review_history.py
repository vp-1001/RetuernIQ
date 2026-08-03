from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.api.dependencies import require_roles
from backend.app.database.session import get_db
from backend.app.models.user_model import User
from backend.app.schemas.intelligence_schema import ReviewHistoryPage
from backend.app.services.review_history_service import (
    list_enriched_review_history,
)

router = APIRouter(
    prefix="/review-history",
    tags=["Review History"],
)


@router.get("", response_model=ReviewHistoryPage)
def get_review_history(
    status: str | None = Query(default=None),
    reviewer_id: str | None = Query(default=None),
    return_id: str | None = Query(default=None),
    search: str | None = Query(default=None, max_length=200),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "merchant", "reviewer")
    ),
) -> ReviewHistoryPage:
    return list_enriched_review_history(
        db=db,
        status=status,
        reviewer_id=reviewer_id,
        return_id=return_id,
        search=search,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )
