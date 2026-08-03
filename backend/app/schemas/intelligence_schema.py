from datetime import datetime

from pydantic import BaseModel


class KPIOverview(BaseModel):
    total_returns: int
    active_reviews: int
    resolved_returns: int
    approved_returns: int
    rejected_returns: int
    escalated_returns: int
    evidence_requested_returns: int
    high_risk_returns: int
    approval_rate: float
    rejection_rate: float
    resolution_rate: float
    average_risk_score: float
    average_resolution_hours: float
    refund_exposure: float
    estimated_savings: float
    generated_at: datetime


class CustomerRiskInsight(BaseModel):
    customer_id: str
    total_returns: int
    high_risk_returns: int
    rejected_returns: int
    average_risk_score: float
    refund_exposure: float
    risk_rank: float


class ProductReturnInsight(BaseModel):
    product_name: str
    total_returns: int
    high_risk_returns: int
    rejected_returns: int
    average_risk_score: float
    refund_exposure: float


class RulePreview(BaseModel):
    human_review_threshold: int
    auto_approval_enabled: bool
    auto_approval_max_score: int
    auto_rejection_enabled: bool
    auto_rejection_min_score: int
    require_evidence: bool
    evidence_minimum_images: int
    manual_override_enabled: bool
    require_override_remarks: bool
    category_rules: dict


class MerchantIntelligenceDashboard(BaseModel):
    kpis: KPIOverview
    top_risky_customers: list[CustomerRiskInsight]
    top_returned_products: list[ProductReturnInsight]
    rules: RulePreview


class ReviewHistoryItem(BaseModel):
    decision_id: str
    return_id: str
    order_id: str
    customer_id: str
    product_name: str
    reviewer_id: str
    reviewer_name: str
    reviewer_email: str
    action: str
    previous_status: str
    new_status: str
    ai_recommendation: str
    final_decision: str
    remarks: str | None
    created_at: datetime


class ReviewHistoryPage(BaseModel):
    items: list[ReviewHistoryItem]
    total: int
    skip: int
    limit: int
