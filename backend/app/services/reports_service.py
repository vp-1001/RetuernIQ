from __future__ import annotations

import csv
import io
from datetime import date
from typing import Iterable

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from backend.app.models.return_model import ReturnRequest
from backend.app.models.review_model import ReviewDecision
from backend.app.services.analytics_service import (
    _category,
    _estimated_fraud_prevented,
    _estimated_loss,
    _estimated_savings,
    _refund_amount,
    load_returns,
    normalize_status,
)


RETURN_HEADERS = [
    "return_id",
    "order_id",
    "customer_id",
    "product_name",
    "product_category",
    "status",
    "risk_score",
    "risk_level",
    "recommendation",
    "refund_amount",
    "estimated_loss",
    "estimated_savings",
    "estimated_fraud_prevented",
    "created_at",
    "updated_at",
]


HISTORY_HEADERS = [
    "decision_id",
    "return_id",
    "order_id",
    "product_name",
    "reviewer_id",
    "reviewer_name",
    "reviewer_email",
    "action",
    "previous_status",
    "new_status",
    "ai_recommendation",
    "final_decision",
    "remarks",
    "created_at",
]


def csv_text(
    headers: list[str],
    rows: Iterable[dict],
) -> str:
    stream = io.StringIO()
    writer = csv.DictWriter(
        stream,
        fieldnames=headers,
        extrasaction="ignore",
    )
    writer.writeheader()
    writer.writerows(rows)
    return stream.getvalue()


def return_rows(
    db: Session,
    *,
    status: str | None = None,
    risk_level: str | None = None,
    category: str | None = None,
    search: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = 5000,
) -> list[dict]:
    returns = load_returns(
        db,
        status=status,
        risk_level=risk_level,
        category=category,
        search=search,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
    )

    return [
        {
            "return_id": item.id,
            "order_id": item.order_id,
            "customer_id": item.customer_id,
            "product_name": item.product_name,
            "product_category": _category(item),
            "status": normalize_status(item.status),
            "risk_score": item.risk_score,
            "risk_level": item.risk_level,
            "recommendation": item.recommendation,
            "refund_amount": _refund_amount(item),
            "estimated_loss": _estimated_loss(item),
            "estimated_savings": _estimated_savings(item),
            "estimated_fraud_prevented": (
                _estimated_fraud_prevented(item)
            ),
            "created_at": item.created_at.isoformat(),
            "updated_at": item.updated_at.isoformat(),
        }
        for item in returns
    ]


def history_rows(
    db: Session,
    *,
    return_id: str | None = None,
    reviewer_id: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = 5000,
) -> list[dict]:
    statement = (
        select(ReviewDecision)
        .options(
            joinedload(ReviewDecision.reviewer),
            joinedload(ReviewDecision.return_request),
        )
        .order_by(ReviewDecision.created_at.desc())
        .limit(limit)
    )

    if return_id:
        statement = statement.where(
            ReviewDecision.return_id == return_id
        )

    if reviewer_id:
        statement = statement.where(
            ReviewDecision.reviewer_id
            == reviewer_id
        )

    rows = db.execute(statement).unique().scalars().all()

    filtered = []

    for decision in rows:
        decision_date = decision.created_at.date()

        if start_date and decision_date < start_date:
            continue

        if end_date and decision_date > end_date:
            continue

        item = decision.return_request
        reviewer = decision.reviewer

        filtered.append(
            {
                "decision_id": decision.id,
                "return_id": decision.return_id,
                "order_id": item.order_id,
                "product_name": item.product_name,
                "reviewer_id": decision.reviewer_id,
                "reviewer_name": reviewer.full_name,
                "reviewer_email": reviewer.email,
                "action": decision.action,
                "previous_status": normalize_status(
                    decision.previous_status
                ),
                "new_status": normalize_status(
                    decision.new_status
                ),
                "ai_recommendation": (
                    decision.ai_recommendation
                ),
                "final_decision": (
                    decision.final_decision
                ),
                "remarks": decision.remarks or "",
                "created_at": (
                    decision.created_at.isoformat()
                ),
            }
        )

    return filtered
