from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from backend.app.api.dependencies import require_roles
from backend.app.database.session import get_db
from backend.app.models.user_model import User
from backend.app.services.analytics_service import (
    build_dashboard,
)
from backend.app.services.reports_service import (
    HISTORY_HEADERS,
    RETURN_HEADERS,
    csv_text,
    history_rows,
    return_rows,
)


router = APIRouter(
    prefix="/reports",
    tags=["Reports & Exports"],
)


def _csv_response(
    filename: str,
    content: str,
) -> Response:
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )


@router.get("/returns.csv")
def export_returns_csv(
    status: str | None = Query(default=None),
    risk_level: str | None = Query(default=None),
    category: str | None = Query(default=None),
    search: str | None = Query(default=None),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    limit: int = Query(default=5000, ge=1, le=20000),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "merchant", "reviewer")
    ),
) -> Response:
    rows = return_rows(
        db,
        status=status,
        risk_level=risk_level,
        category=category,
        search=search,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
    )

    suffix = status or "all"

    return _csv_response(
        f"returniq_returns_{suffix}.csv",
        csv_text(RETURN_HEADERS, rows),
    )


@router.get("/reviews.csv")
def export_review_history_csv(
    return_id: str | None = Query(default=None),
    reviewer_id: str | None = Query(default=None),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    limit: int = Query(default=5000, ge=1, le=20000),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "merchant", "reviewer")
    ),
) -> Response:
    rows = history_rows(
        db,
        return_id=return_id,
        reviewer_id=reviewer_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
    )

    return _csv_response(
        "returniq_review_history.csv",
        csv_text(HISTORY_HEADERS, rows),
    )


@router.get("/analytics-summary.csv")
def export_analytics_summary_csv(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "merchant", "reviewer")
    ),
) -> Response:
    dashboard = build_dashboard(
        db,
        start_date=start_date,
        end_date=end_date,
    )

    overview = dashboard.overview.model_dump()

    rows = [
        {
            "metric": key,
            "value": value.isoformat()
            if isinstance(value, datetime)
            else value,
        }
        for key, value in overview.items()
    ]

    return _csv_response(
        "returniq_analytics_summary.csv",
        csv_text(["metric", "value"], rows),
    )
