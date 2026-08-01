from sqlalchemy import func, select, update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload

from backend.app.models.merchant_settings_model import MerchantSettings
from backend.app.models.return_model import ReturnRequest
from backend.app.models.review_model import ReviewDecision
from backend.app.models.user_model import User
from backend.app.schemas.review_schema import (
    ReviewAction,
    ReviewDecisionCreate,
    ReviewDecisionResponse,
    ReviewDetailResponse,
    ReviewQueueItem,
    ReviewQueueSummary,
    ReviewStatus,
)


CANONICAL_STATUS_BY_ACTION = {
    ReviewAction.APPROVE: "approved",
    ReviewAction.REJECT: "rejected",
    ReviewAction.REQUEST_EVIDENCE: "evidence_requested",
    ReviewAction.ESCALATE: "escalated",
}


FINAL_DECISION_BY_ACTION = {
    ReviewAction.APPROVE: "approve_refund",
    ReviewAction.REJECT: "reject_refund",
    ReviewAction.REQUEST_EVIDENCE: "request_evidence",
    ReviewAction.ESCALATE: "senior_review",
}


STATUS_ALIASES = {
    "pending": "pending",
    "approved": "approved",
    "approve": "approved",
    "approve_return": "approved",
    "approve_refund": "approved",
    "instant_refund": "approved",
    "rejected": "rejected",
    "reject": "rejected",
    "reject_return": "rejected",
    "reject_refund": "rejected",
    "evidence_requested": "evidence_requested",
    "request_evidence": "evidence_requested",
    "escalated": "escalated",
    "escalate": "escalated",
    "manual_inspection": "escalated",
    "senior_review": "escalated",
}


FILTER_VALUES = {
    "pending": {"pending"},
    "approved": {
        "approved",
        "approve",
        "approve_return",
        "approve_refund",
        "instant_refund",
    },
    "rejected": {
        "rejected",
        "reject",
        "reject_return",
        "reject_refund",
    },
    "evidence_requested": {
        "evidence_requested",
        "request_evidence",
    },
    "escalated": {
        "escalated",
        "escalate",
        "manual_inspection",
        "senior_review",
    },
}


ALLOWED_REVIEW_STATUSES = set(FILTER_VALUES)


def _normalize_status(status_value: str | None) -> str:
    normalized_value = (status_value or "pending").strip().lower()

    return STATUS_ALIASES.get(
        normalized_value,
        normalized_value,
    )


def _repair_legacy_statuses(db: Session) -> None:
    replacements = {
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

    changed = False

    try:
        for old_status, new_status in replacements.items():
            result = db.execute(
                update(ReturnRequest)
                .where(ReturnRequest.status == old_status)
                .values(status=new_status)
            )

            if result.rowcount:
                changed = True

        if changed:
            db.commit()

    except SQLAlchemyError:
        db.rollback()
        raise


def _build_decision_response(
    decision: ReviewDecision,
) -> ReviewDecisionResponse:
    return ReviewDecisionResponse.model_validate(decision)


def _latest_decision(
    return_request: ReturnRequest,
) -> ReviewDecisionResponse | None:
    if not return_request.review_decisions:
        return None

    return _build_decision_response(
        return_request.review_decisions[0]
    )


def _requires_human_review(
    return_request: ReturnRequest,
) -> bool:
    assessment_payload = return_request.assessment_payload or {}

    return bool(
        assessment_payload.get(
            "human_review_required",
            False,
        )
    )


def _recommendation_reason(
    return_request: ReturnRequest,
) -> str:
    assessment_payload = return_request.assessment_payload or {}

    return str(
        assessment_payload.get(
            "recommendation_reason",
            "",
        )
    )


def build_queue_item(
    return_request: ReturnRequest,
) -> ReviewQueueItem:
    normalized_status = _normalize_status(
        return_request.status
    )

    return ReviewQueueItem(
        return_id=return_request.id,
        order_id=return_request.order_id,
        customer_id=return_request.customer_id,
        product_name=return_request.product_name,
        risk_score=return_request.risk_score,
        risk_level=return_request.risk_level,
        recommendation=return_request.recommendation,
        status=ReviewStatus(normalized_status),
        human_review_required=_requires_human_review(
            return_request
        ),
        recommendation_reason=_recommendation_reason(
            return_request
        ),
        created_at=return_request.created_at,
        updated_at=return_request.updated_at,
        latest_decision=_latest_decision(
            return_request
        ),
    )


def list_review_queue(
    db: Session,
    review_status: str | None = None,
    risk_level: str | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[ReviewQueueItem]:
    _repair_legacy_statuses(db)

    statement = (
        select(ReturnRequest)
        .options(
            joinedload(
                ReturnRequest.review_decisions
            ).joinedload(
                ReviewDecision.reviewer
            )
        )
        .order_by(
            ReturnRequest.updated_at.desc()
        )
    )

    if review_status:
        normalized_status = _normalize_status(
            review_status
        )

        if normalized_status not in ALLOWED_REVIEW_STATUSES:
            raise ValueError(
                "Invalid review status."
            )

        statement = statement.where(
            ReturnRequest.status.in_(
                FILTER_VALUES[normalized_status]
            )
        )
    else:
        statement = statement.where(
            ReturnRequest.status.in_(
                FILTER_VALUES["pending"]
                | FILTER_VALUES["evidence_requested"]
                | FILTER_VALUES["escalated"]
            )
        )

    if risk_level:
        statement = statement.where(
            func.lower(ReturnRequest.risk_level)
            == risk_level.strip().lower()
        )

    if search:
        search_value = (
            f"%{search.strip().lower()}%"
        )

        statement = statement.where(
            func.lower(
                ReturnRequest.order_id
            ).like(search_value)
            | func.lower(
                ReturnRequest.customer_id
            ).like(search_value)
            | func.lower(
                ReturnRequest.product_name
            ).like(search_value)
            | func.lower(
                ReturnRequest.id
            ).like(search_value)
        )

    statement = statement.offset(skip).limit(limit)

    return_requests = (
        db.execute(statement)
        .unique()
        .scalars()
        .all()
    )

    return [
        build_queue_item(return_request)
        for return_request in return_requests
    ]


def get_review_detail(
    db: Session,
    return_id: str,
) -> ReviewDetailResponse | None:
    _repair_legacy_statuses(db)

    statement = (
        select(ReturnRequest)
        .options(
            joinedload(
                ReturnRequest.review_decisions
            ).joinedload(
                ReviewDecision.reviewer
            )
        )
        .where(
            ReturnRequest.id == return_id
        )
    )

    return_request = (
        db.execute(statement)
        .unique()
        .scalar_one_or_none()
    )

    if return_request is None:
        return None

    audit_trail = [
        _build_decision_response(decision)
        for decision in return_request.review_decisions
    ]

    normalized_status = _normalize_status(
        return_request.status
    )

    return ReviewDetailResponse(
        return_id=return_request.id,
        order_id=return_request.order_id,
        customer_id=return_request.customer_id,
        product_name=return_request.product_name,
        risk_score=return_request.risk_score,
        risk_level=return_request.risk_level,
        recommendation=return_request.recommendation,
        status=ReviewStatus(normalized_status),
        request_payload=return_request.request_payload,
        assessment_payload=return_request.assessment_payload,
        created_at=return_request.created_at,
        updated_at=return_request.updated_at,
        audit_trail=audit_trail,
    )


def create_review_decision(
    db: Session,
    return_request: ReturnRequest,
    reviewer: User,
    decision_data: ReviewDecisionCreate,
    settings: MerchantSettings,
    evidence_count: int,
) -> ReviewDecisionResponse:
    current_status = _normalize_status(
        return_request.status
    )

    if current_status in {
        ReviewStatus.APPROVED.value,
        ReviewStatus.REJECTED.value,
    }:
        raise ValueError(
            "This return already has a final decision and "
            "cannot be reviewed again."
        )

    recommendation_to_action = {
        "instant_refund": ReviewAction.APPROVE,
        "approve_refund": ReviewAction.APPROVE,
        "request_evidence": ReviewAction.REQUEST_EVIDENCE,
        "manual_inspection": ReviewAction.ESCALATE,
        "senior_review": ReviewAction.ESCALATE,
    }

    recommended_action = recommendation_to_action.get(
        return_request.recommendation
    )

    is_override = (
        recommended_action is not None
        and decision_data.action != recommended_action
    )

    if is_override and not settings.manual_override_enabled:
        raise ValueError(
            "Manual override is disabled in merchant settings."
        )

    if (
        is_override
        and settings.require_override_remarks
        and not decision_data.remarks
    ):
        raise ValueError(
            "Reviewer remarks are required when overriding "
            "the AI recommendation."
        )

    if decision_data.action == ReviewAction.APPROVE:
        request_payload = return_request.request_payload or {}
        financial_data = request_payload.get(
            "financial_data",
            {},
        )

        refund_amount = float(
            financial_data.get("refund_amount", 0)
        )

        evidence_required = (
            settings.require_evidence
            and refund_amount
            >= settings.evidence_required_above_amount
        )

        if (
            evidence_required
            and evidence_count
            < settings.evidence_minimum_images
        ):
            raise ValueError(
                "Approval requires at least "
                f"{settings.evidence_minimum_images} evidence "
                "image(s) under the current merchant policy."
            )

    previous_status = _normalize_status(
        return_request.status
    )

    new_status = CANONICAL_STATUS_BY_ACTION[
        decision_data.action
    ]

    final_decision = FINAL_DECISION_BY_ACTION[
        decision_data.action
    ]

    review_decision = ReviewDecision(
        return_id=return_request.id,
        reviewer_id=reviewer.id,
        action=decision_data.action.value,
        previous_status=previous_status,
        new_status=new_status,
        ai_recommendation=return_request.recommendation,
        final_decision=final_decision,
        remarks=decision_data.remarks,
    )

    return_request.status = new_status

    try:
        db.add(review_decision)
        db.add(return_request)
        db.commit()

        statement = (
            select(ReviewDecision)
            .options(
                joinedload(
                    ReviewDecision.reviewer
                )
            )
            .where(
                ReviewDecision.id
                == review_decision.id
            )
        )

        saved_decision = (
            db.execute(statement)
            .unique()
            .scalar_one()
        )

        return _build_decision_response(
            saved_decision
        )

    except SQLAlchemyError:
        db.rollback()
        raise


def list_review_history(
    db: Session,
    return_id: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[ReviewDecisionResponse]:
    statement = (
        select(ReviewDecision)
        .options(joinedload(ReviewDecision.reviewer))
        .order_by(ReviewDecision.created_at.desc())
    )

    if return_id:
        statement = statement.where(
            ReviewDecision.return_id == return_id
        )

    decisions = (
        db.execute(
            statement.offset(skip).limit(limit)
        )
        .unique()
        .scalars()
        .all()
    )

    return [
        _build_decision_response(decision)
        for decision in decisions
    ]


def get_review_summary(
    db: Session,
) -> ReviewQueueSummary:
    _repair_legacy_statuses(db)

    rows = db.execute(
        select(
            ReturnRequest.status,
            func.count(ReturnRequest.id),
        ).group_by(
            ReturnRequest.status
        )
    ).all()

    counts = {
        "pending": 0,
        "approved": 0,
        "rejected": 0,
        "evidence_requested": 0,
        "escalated": 0,
    }

    for status_name, count in rows:
        normalized_status = _normalize_status(
            status_name
        )

        if normalized_status in counts:
            counts[normalized_status] += count

    return ReviewQueueSummary(
        total=sum(counts.values()),
        pending=counts["pending"],
        approved=counts["approved"],
        rejected=counts["rejected"],
        evidence_requested=counts[
            "evidence_requested"
        ],
        escalated=counts["escalated"],
    )