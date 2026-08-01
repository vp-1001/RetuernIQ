from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ReviewStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EVIDENCE_REQUESTED = "evidence_requested"
    ESCALATED = "escalated"


class ReviewAction(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"
    REQUEST_EVIDENCE = "request_evidence"
    ESCALATE = "escalate"


class ReviewDecisionCreate(BaseModel):
    action: ReviewAction

    remarks: str | None = Field(
        default=None,
        max_length=2000,
    )

    @field_validator("remarks", mode="before")
    @classmethod
    def clean_remarks(cls, value):
        if value is None:
            return None

        if isinstance(value, str):
            cleaned_value = value.strip()
            return cleaned_value or None

        return value

    @field_validator("remarks")
    @classmethod
    def require_remarks_for_non_approval(
        cls,
        value,
        info,
    ):
        action = info.data.get("action")

        actions_requiring_remarks = {
            ReviewAction.REJECT,
            ReviewAction.REQUEST_EVIDENCE,
            ReviewAction.ESCALATE,
        }

        if action in actions_requiring_remarks and not value:
            raise ValueError(
                "Remarks are required for this review action."
            )

        return value


class ReviewerSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    email: str
    role: str


class ReviewDecisionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    return_id: str
    reviewer_id: str

    action: ReviewAction
    previous_status: ReviewStatus
    new_status: ReviewStatus

    ai_recommendation: str
    final_decision: str

    remarks: str | None
    created_at: datetime

    reviewer: ReviewerSummary


class ReviewQueueItem(BaseModel):
    return_id: str
    order_id: str
    customer_id: str
    product_name: str

    risk_score: int
    risk_level: str
    recommendation: str
    status: ReviewStatus

    human_review_required: bool
    recommendation_reason: str

    created_at: datetime
    updated_at: datetime

    latest_decision: ReviewDecisionResponse | None = None


class ReviewDetailResponse(BaseModel):
    return_id: str
    order_id: str
    customer_id: str
    product_name: str

    risk_score: int
    risk_level: str
    recommendation: str
    status: ReviewStatus

    request_payload: dict[str, Any]
    assessment_payload: dict[str, Any]

    created_at: datetime
    updated_at: datetime

    audit_trail: list[ReviewDecisionResponse]


class ReviewQueueSummary(BaseModel):
    total: int
    pending: int
    approved: int
    rejected: int
    evidence_requested: int
    escalated: int