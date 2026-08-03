from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.models.return_model import ReturnRequest
from backend.app.models.review_model import ReviewDecision
from backend.app.schemas.intelligence_schema import KPIOverview
from backend.app.services.analytics_service import (
    _estimated_savings,
    _refund_amount,
    normalize_status,
)


ACTIVE_STATUSES = {
    "pending",
    "evidence_requested",
    "escalated",
}


def build_kpi_overview(db: Session) -> KPIOverview:
    returns = db.execute(
        select(ReturnRequest)
    ).scalars().all()

    total = len(returns)
    statuses = defaultdict(int)

    for item in returns:
        statuses[normalize_status(item.status)] += 1

    approved = statuses["approved"]
    rejected = statuses["rejected"]
    resolved = approved + rejected
    active = sum(statuses[name] for name in ACTIVE_STATUSES)

    high_risk = sum(
        1
        for item in returns
        if item.risk_score >= 70
        or item.risk_level.lower() in {"high", "critical"}
    )

    average_risk = (
        sum(item.risk_score for item in returns) / total
        if total
        else 0
    )

    refund_exposure = sum(
        _refund_amount(item)
        for item in returns
        if normalize_status(item.status) in ACTIVE_STATUSES
    )

    estimated_savings = sum(
        _estimated_savings(item)
        for item in returns
    )

    resolution_rows = db.execute(
        select(
            ReviewDecision.return_id,
            func.min(ReviewDecision.created_at),
        ).where(
            ReviewDecision.new_status.in_(["approved", "rejected"])
        ).group_by(ReviewDecision.return_id)
    ).all()

    created_by_id = {item.id: item.created_at for item in returns}
    durations = []

    for return_id, resolved_at in resolution_rows:
        created_at = created_by_id.get(return_id)
        if created_at is not None and resolved_at is not None:
            durations.append(
                max((resolved_at - created_at).total_seconds(), 0) / 3600
            )

    average_resolution_hours = (
        sum(durations) / len(durations)
        if durations
        else 0
    )

    return KPIOverview(
        total_returns=total,
        active_reviews=active,
        resolved_returns=resolved,
        approved_returns=approved,
        rejected_returns=rejected,
        escalated_returns=statuses["escalated"],
        evidence_requested_returns=statuses["evidence_requested"],
        high_risk_returns=high_risk,
        approval_rate=round(approved / resolved * 100, 2) if resolved else 0,
        rejection_rate=round(rejected / resolved * 100, 2) if resolved else 0,
        resolution_rate=round(resolved / total * 100, 2) if total else 0,
        average_risk_score=round(average_risk, 2),
        average_resolution_hours=round(average_resolution_hours, 2),
        refund_exposure=round(refund_exposure, 2),
        estimated_savings=round(estimated_savings, 2),
        generated_at=datetime.now(timezone.utc),
    )
