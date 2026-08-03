from datetime import date, datetime

from pydantic import BaseModel, Field


class CountBucket(BaseModel):
    label: str
    count: int


class MoneyBucket(BaseModel):
    label: str
    amount: float


class TrendPoint(BaseModel):
    date: date
    total_returns: int
    approved: int
    rejected: int
    pending: int
    escalated: int
    evidence_requested: int
    estimated_loss: float
    estimated_savings: float


class ProductInsight(BaseModel):
    product_name: str
    total_returns: int
    high_risk_returns: int
    approved: int
    rejected: int
    refund_exposure: float


class CategoryInsight(BaseModel):
    category: str
    total_returns: int
    high_risk_returns: int
    refund_exposure: float
    estimated_savings: float


class ReviewerPerformance(BaseModel):
    reviewer_id: str
    reviewer_name: str
    reviewer_email: str
    total_decisions: int
    unique_returns_reviewed: int
    approved: int
    rejected: int
    escalated: int
    evidence_requested: int
    approval_rate: float
    rejection_rate: float


class AnalyticsOverview(BaseModel):
    total_returns: int
    pending: int
    approved: int
    rejected: int
    escalated: int
    evidence_requested: int

    high_risk_cases: int
    critical_risk_cases: int
    human_review_cases: int

    refund_exposure: float
    estimated_loss: float
    estimated_savings: float
    estimated_fraud_prevented: float

    approval_rate: float
    rejection_rate: float
    resolution_rate: float

    average_risk_score: float
    average_refund_amount: float

    generated_at: datetime


class AnalyticsDashboard(BaseModel):
    overview: AnalyticsOverview
    status_distribution: list[CountBucket]
    risk_distribution: list[CountBucket]
    recommendation_distribution: list[CountBucket]
    return_trend: list[TrendPoint]
    top_products: list[ProductInsight]
    category_insights: list[CategoryInsight]
    reviewer_performance: list[ReviewerPerformance]


class ReportFilter(BaseModel):
    status: str | None = None
    risk_level: str | None = None
    category: str | None = None
    search: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    reviewer_id: str | None = None
    limit: int = Field(default=5000, ge=1, le=20000)
