from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from backend.app.models.review_model import ReviewDecision
from backend.app.schemas.intelligence_schema import (
    ReviewHistoryItem,
    ReviewHistoryPage,
)
from backend.app.services.analytics_service import normalize_status


def list_enriched_review_history(
    db: Session,
    *,
    status: str | None = None,
    reviewer_id: str | None = None,
    return_id: str | None = None,
    search: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    skip: int = 0,
    limit: int = 100,
) -> ReviewHistoryPage:
    statement = (
        select(ReviewDecision)
        .options(
            joinedload(ReviewDecision.reviewer),
            joinedload(ReviewDecision.return_request),
        )
        .order_by(ReviewDecision.created_at.desc())
    )

    if reviewer_id:
        statement = statement.where(
            ReviewDecision.reviewer_id == reviewer_id
        )

    if return_id:
        statement = statement.where(
            ReviewDecision.return_id == return_id
        )

    rows = db.execute(statement).unique().scalars().all()
    filtered = []
    normalized_status = normalize_status(status) if status else None
    search_value = search.strip().lower() if search else None

    for decision in rows:
        return_request = decision.return_request
        reviewer = decision.reviewer
        decision_status = normalize_status(decision.new_status)

        if normalized_status and decision_status != normalized_status:
            continue

        created_date = decision.created_at.date()
        if start_date and created_date < start_date:
            continue
        if end_date and created_date > end_date:
            continue

        if search_value:
            haystack = " ".join(
                [
                    decision.return_id,
                    return_request.order_id,
                    return_request.customer_id,
                    return_request.product_name,
                    reviewer.full_name,
                    reviewer.email,
                    decision.remarks or "",
                ]
            ).lower()
            if search_value not in haystack:
                continue

        filtered.append(
            ReviewHistoryItem(
                decision_id=decision.id,
                return_id=decision.return_id,
                order_id=return_request.order_id,
                customer_id=return_request.customer_id,
                product_name=return_request.product_name,
                reviewer_id=decision.reviewer_id,
                reviewer_name=reviewer.full_name,
                reviewer_email=reviewer.email,
                action=decision.action,
                previous_status=normalize_status(
                    decision.previous_status
                ),
                new_status=decision_status,
                ai_recommendation=decision.ai_recommendation,
                final_decision=decision.final_decision,
                remarks=decision.remarks,
                created_at=decision.created_at,
            )
        )

    total = len(filtered)
    items = filtered[skip : skip + limit]

    return ReviewHistoryPage(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
    )
