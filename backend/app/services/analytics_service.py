from __future__ import annotations

from collections import Counter, defaultdict
from datetime import date, datetime, time, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from backend.app.models.return_model import ReturnRequest
from backend.app.models.review_model import ReviewDecision
from backend.app.schemas.analytics_schema import (
    AnalyticsDashboard,
    AnalyticsOverview,
    CategoryInsight,
    CountBucket,
    ProductInsight,
    ReviewerPerformance,
    TrendPoint,
)


FINAL_STATUSES = {"approved", "rejected"}
ACTIVE_STATUSES = {
    "pending",
    "evidence_requested",
    "escalated",
}


def normalize_status(value: str | None) -> str:
    normalized = (value or "pending").strip().lower()

    aliases = {
        "approve": "approved",
        "approve_return": "approved",
        "approve_refund": "approved",
        "instant_refund": "approved",
        "reject": "rejected",
        "reject_return": "rejected",
        "reject_refund": "rejected",
        "request_evidence": "evidence_requested",
        "escalate": "escalated",
        "manual_inspection": "escalated",
        "senior_review": "escalated",
    }

    return aliases.get(normalized, normalized)


def _payload(return_request: ReturnRequest) -> dict[str, Any]:
    return return_request.request_payload or {}


def _assessment(return_request: ReturnRequest) -> dict[str, Any]:
    return return_request.assessment_payload or {}


def _financial_data(return_request: ReturnRequest) -> dict[str, Any]:
    payload = _payload(return_request)
    return payload.get("financial_data", {}) or {}


def _refund_amount(return_request: ReturnRequest) -> float:
    value = _financial_data(return_request).get("refund_amount", 0)
    return float(value or 0)


def _estimated_loss(return_request: ReturnRequest) -> float:
    assessment = _assessment(return_request)
    financial = assessment.get("financial_impact", {}) or {}
    value = financial.get("estimated_loss", 0)
    return float(value or 0)


def _category(return_request: ReturnRequest) -> str:
    value = _payload(return_request).get("product_category", "other")
    return str(value or "other").strip().lower()


def _is_human_review(return_request: ReturnRequest) -> bool:
    return bool(
        _assessment(return_request).get(
            "human_review_required",
            False,
        )
    )


def _is_high_risk(return_request: ReturnRequest) -> bool:
    return (
        return_request.risk_level.lower() in {"high", "critical"}
        or return_request.risk_score >= 70
    )


def _estimated_savings(return_request: ReturnRequest) -> float:
    status = normalize_status(return_request.status)
    refund_amount = _refund_amount(return_request)
    estimated_loss = _estimated_loss(return_request)

    if status == "rejected":
        return max(refund_amount, estimated_loss)

    if status in {"escalated", "evidence_requested"} and _is_high_risk(
        return_request
    ):
        return max(estimated_loss * 0.35, refund_amount * 0.15)

    return 0.0


def _estimated_fraud_prevented(
    return_request: ReturnRequest,
) -> float:
    status = normalize_status(return_request.status)

    if status == "rejected" and _is_high_risk(return_request):
        return max(
            _refund_amount(return_request),
            _estimated_loss(return_request),
        )

    return 0.0


def _date_bounds(
    start_date: date | None,
    end_date: date | None,
) -> tuple[datetime | None, datetime | None]:
    start = (
        datetime.combine(
            start_date,
            time.min,
            tzinfo=timezone.utc,
        )
        if start_date
        else None
    )

    end = (
        datetime.combine(
            end_date + timedelta(days=1),
            time.min,
            tzinfo=timezone.utc,
        )
        if end_date
        else None
    )

    return start, end


def load_returns(
    db: Session,
    *,
    start_date: date | None = None,
    end_date: date | None = None,
    status: str | None = None,
    risk_level: str | None = None,
    category: str | None = None,
    search: str | None = None,
    limit: int = 20000,
) -> list[ReturnRequest]:
    start, end = _date_bounds(start_date, end_date)

    statement = (
        select(ReturnRequest)
        .options(
            joinedload(ReturnRequest.review_decisions).joinedload(
                ReviewDecision.reviewer
            )
        )
        .order_by(ReturnRequest.created_at.desc())
        .limit(limit)
    )

    if start is not None:
        statement = statement.where(
            ReturnRequest.created_at >= start
        )

    if end is not None:
        statement = statement.where(
            ReturnRequest.created_at < end
        )

    if risk_level:
        statement = statement.where(
            ReturnRequest.risk_level
            == risk_level.strip().lower()
        )

    if search:
        search_value = f"%{search.strip().lower()}%"
        statement = statement.where(
            ReturnRequest.order_id.ilike(search_value)
            | ReturnRequest.customer_id.ilike(search_value)
            | ReturnRequest.product_name.ilike(search_value)
            | ReturnRequest.id.ilike(search_value)
        )

    rows = (
        db.execute(statement)
        .unique()
        .scalars()
        .all()
    )

    normalized_status = normalize_status(status) if status else None
    normalized_category = category.strip().lower() if category else None

    filtered = []

    for item in rows:
        if (
            normalized_status
            and normalize_status(item.status)
            != normalized_status
        ):
            continue

        if (
            normalized_category
            and _category(item)
            != normalized_category
        ):
            continue

        filtered.append(item)

    return filtered


def build_dashboard(
    db: Session,
    *,
    start_date: date | None = None,
    end_date: date | None = None,
) -> AnalyticsDashboard:
    returns = load_returns(
        db,
        start_date=start_date,
        end_date=end_date,
    )

    total = len(returns)
    statuses = Counter(
        normalize_status(item.status)
        for item in returns
    )
    risks = Counter(
        item.risk_level.lower()
        for item in returns
    )
    recommendations = Counter(
        item.recommendation
        for item in returns
    )

    refund_exposure = sum(
        _refund_amount(item)
        for item in returns
        if normalize_status(item.status)
        in ACTIVE_STATUSES
    )

    estimated_loss = sum(
        _estimated_loss(item)
        for item in returns
    )

    estimated_savings = sum(
        _estimated_savings(item)
        for item in returns
    )

    estimated_fraud_prevented = sum(
        _estimated_fraud_prevented(item)
        for item in returns
    )

    approved = statuses.get("approved", 0)
    rejected = statuses.get("rejected", 0)
    resolved = approved + rejected

    overview = AnalyticsOverview(
        total_returns=total,
        pending=statuses.get("pending", 0),
        approved=approved,
        rejected=rejected,
        escalated=statuses.get("escalated", 0),
        evidence_requested=statuses.get(
            "evidence_requested",
            0,
        ),
        high_risk_cases=sum(
            1 for item in returns if _is_high_risk(item)
        ),
        critical_risk_cases=sum(
            1
            for item in returns
            if item.risk_level.lower() == "critical"
        ),
        human_review_cases=sum(
            1 for item in returns if _is_human_review(item)
        ),
        refund_exposure=round(refund_exposure, 2),
        estimated_loss=round(estimated_loss, 2),
        estimated_savings=round(estimated_savings, 2),
        estimated_fraud_prevented=round(
            estimated_fraud_prevented,
            2,
        ),
        approval_rate=round(
            approved / resolved * 100,
            2,
        )
        if resolved
        else 0,
        rejection_rate=round(
            rejected / resolved * 100,
            2,
        )
        if resolved
        else 0,
        resolution_rate=round(
            resolved / total * 100,
            2,
        )
        if total
        else 0,
        average_risk_score=round(
            sum(item.risk_score for item in returns)
            / total,
            2,
        )
        if total
        else 0,
        average_refund_amount=round(
            sum(_refund_amount(item) for item in returns)
            / total,
            2,
        )
        if total
        else 0,
        generated_at=datetime.now(timezone.utc),
    )

    daily = defaultdict(
        lambda: {
            "total_returns": 0,
            "approved": 0,
            "rejected": 0,
            "pending": 0,
            "escalated": 0,
            "evidence_requested": 0,
            "estimated_loss": 0.0,
            "estimated_savings": 0.0,
        }
    )

    product_data = defaultdict(
        lambda: {
            "total_returns": 0,
            "high_risk_returns": 0,
            "approved": 0,
            "rejected": 0,
            "refund_exposure": 0.0,
        }
    )

    category_data = defaultdict(
        lambda: {
            "total_returns": 0,
            "high_risk_returns": 0,
            "refund_exposure": 0.0,
            "estimated_savings": 0.0,
        }
    )

    for item in returns:
        day = item.created_at.date()
        status_value = normalize_status(item.status)

        daily[day]["total_returns"] += 1
        if status_value in daily[day]:
            daily[day][status_value] += 1
        daily[day]["estimated_loss"] += _estimated_loss(item)
        daily[day]["estimated_savings"] += _estimated_savings(item)

        product = product_data[item.product_name]
        product["total_returns"] += 1
        product["high_risk_returns"] += int(_is_high_risk(item))
        product["approved"] += int(status_value == "approved")
        product["rejected"] += int(status_value == "rejected")
        product["refund_exposure"] += _refund_amount(item)

        category_value = _category(item)
        category_row = category_data[category_value]
        category_row["total_returns"] += 1
        category_row["high_risk_returns"] += int(
            _is_high_risk(item)
        )
        category_row["refund_exposure"] += _refund_amount(item)
        category_row["estimated_savings"] += _estimated_savings(
            item
        )

    reviewer_data = defaultdict(
        lambda: {
            "name": "",
            "email": "",
            "total": 0,
            "return_ids": set(),
            "approved": 0,
            "rejected": 0,
            "escalated": 0,
            "evidence_requested": 0,
        }
    )

    for item in returns:
        for decision in item.review_decisions:
            reviewer = decision.reviewer
            row = reviewer_data[decision.reviewer_id]
            row["name"] = reviewer.full_name
            row["email"] = reviewer.email
            row["total"] += 1
            row["return_ids"].add(item.id)

            status_value = normalize_status(
                decision.new_status
            )
            if status_value in row:
                row[status_value] += 1

    reviewer_performance = []

    for reviewer_id, row in reviewer_data.items():
        total_decisions = row["total"]

        reviewer_performance.append(
            ReviewerPerformance(
                reviewer_id=reviewer_id,
                reviewer_name=row["name"],
                reviewer_email=row["email"],
                total_decisions=total_decisions,
                unique_returns_reviewed=len(row["return_ids"]),
                approved=row["approved"],
                rejected=row["rejected"],
                escalated=row["escalated"],
                evidence_requested=row[
                    "evidence_requested"
                ],
                approval_rate=round(
                    row["approved"]
                    / total_decisions
                    * 100,
                    2,
                )
                if total_decisions
                else 0,
                rejection_rate=round(
                    row["rejected"]
                    / total_decisions
                    * 100,
                    2,
                )
                if total_decisions
                else 0,
            )
        )

    reviewer_performance.sort(
        key=lambda item: item.total_decisions,
        reverse=True,
    )

    return AnalyticsDashboard(
        overview=overview,
        status_distribution=[
            CountBucket(label=label, count=count)
            for label, count in sorted(
                statuses.items()
            )
        ],
        risk_distribution=[
            CountBucket(label=label, count=count)
            for label, count in sorted(
                risks.items()
            )
        ],
        recommendation_distribution=[
            CountBucket(label=label, count=count)
            for label, count in recommendations.most_common()
        ],
        return_trend=[
            TrendPoint(
                date=day,
                total_returns=values["total_returns"],
                approved=values["approved"],
                rejected=values["rejected"],
                pending=values["pending"],
                escalated=values["escalated"],
                evidence_requested=values[
                    "evidence_requested"
                ],
                estimated_loss=round(
                    values["estimated_loss"],
                    2,
                ),
                estimated_savings=round(
                    values["estimated_savings"],
                    2,
                ),
            )
            for day, values in sorted(daily.items())
        ],
        top_products=[
            ProductInsight(
                product_name=name,
                total_returns=values["total_returns"],
                high_risk_returns=values[
                    "high_risk_returns"
                ],
                approved=values["approved"],
                rejected=values["rejected"],
                refund_exposure=round(
                    values["refund_exposure"],
                    2,
                ),
            )
            for name, values in sorted(
                product_data.items(),
                key=lambda item: item[1][
                    "total_returns"
                ],
                reverse=True,
            )[:10]
        ],
        category_insights=[
            CategoryInsight(
                category=name,
                total_returns=values["total_returns"],
                high_risk_returns=values[
                    "high_risk_returns"
                ],
                refund_exposure=round(
                    values["refund_exposure"],
                    2,
                ),
                estimated_savings=round(
                    values["estimated_savings"],
                    2,
                ),
            )
            for name, values in sorted(
                category_data.items(),
                key=lambda item: item[1][
                    "total_returns"
                ],
                reverse=True,
            )
        ],
        reviewer_performance=reviewer_performance,
    )
