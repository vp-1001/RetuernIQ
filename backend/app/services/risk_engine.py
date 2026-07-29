from backend.app.schemas.return_schema import (
    FinancialImpact,
    ReturnCreate
)


def calculate_financial_impact(data: ReturnCreate) -> FinancialImpact:
    financial = data.financial_data

    operational_cost = (
        financial.reverse_shipping_cost
        + financial.inspection_cost
        + financial.repair_cost
        + financial.disposal_cost
    )

    estimated_loss = (
        financial.refund_amount
        + operational_cost
        - financial.recoverable_resale_value
    )

    return FinancialImpact(
        estimated_loss=round(max(0, estimated_loss), 2),
        refund_amount=round(financial.refund_amount, 2),
        operational_cost=round(operational_cost, 2),
        recoverable_value=round(financial.recoverable_resale_value, 2)
    )
from backend.app.schemas.return_schema import RiskLevel


def determine_risk_level(score: int) -> RiskLevel:
    if score < 30:
        return RiskLevel.LOW

    if score < 60:
        return RiskLevel.MEDIUM

    if score < 80:
        return RiskLevel.HIGH

    return RiskLevel.CRITICAL

from backend.app.schemas.return_schema import RiskFactor


def calculate_risk(data: ReturnCreate):
    score = 0
    factors = []

    history = data.customer_history

    return_rate = (
        history.total_returns / history.total_orders
        if history.total_orders > 0
        else 0
    )

    # High return rate
    if return_rate >= 0.60:
        score += 25
        factors.append(
            RiskFactor(
                name="High Return Rate",
                impact=25,
                explanation="Customer has returned more than 60% of previous orders."
            )
        )

    # High-value product
    if data.product_price >= 20000:
        score += 15
        factors.append(
            RiskFactor(
                name="High Value Product",
                impact=15,
                explanation="Expensive products carry higher fraud risk."
            )
        )

    # Late return
    if data.days_after_delivery >= 13:
        score += 10
        factors.append(
            RiskFactor(
                name="Late Return",
                impact=10,
                explanation="Return requested near the end of the return window."
            )
        )

    # Missing accessories
    if data.missing_accessories:
        score += 20
        factors.append(
            RiskFactor(
                name="Missing Accessories",
                impact=20,
                explanation="Expected accessories are missing."
            )
        )

    # Duplicate image
    if data.duplicate_image_detected:
        score += 30
        factors.append(
            RiskFactor(
                name="Duplicate Image",
                impact=30,
                explanation="Uploaded evidence appears duplicated."
            )
        )

    # Image mismatch
    if data.image_mismatch_detected:
        score += 25
        factors.append(
            RiskFactor(
                name="Image Mismatch",
                impact=25,
                explanation="Uploaded image may not match the ordered product."
            )
        )

    # Trusted customer bonus
    if (
        history.account_age_days >= 730
        and return_rate < 0.20
    ):
        score -= 15
        factors.append(
            RiskFactor(
                name="Trusted Customer",
                impact=-15,
                explanation="Long account history with very few returns."
            )
        )

    score = max(0, min(score, 100))

    return score, factors

from backend.app.schemas.return_schema import Recommendation


def determine_recommendation(
    score: int,
    estimated_loss: float,
    data: ReturnCreate
):
    if score < 30 and data.product_price <= 1000:
        return (
            Recommendation.INSTANT_REFUND,
            "Low-risk and low-value return. Instant refund is recommended."
        )

    if score < 30:
        return (
            Recommendation.APPROVE_REFUND,
            "The return has low risk and can be approved."
        )

    if score < 60:
        return (
            Recommendation.REQUEST_EVIDENCE,
            "The return has moderate risk. Additional evidence is required."
        )

    if score < 80:
        return (
            Recommendation.MANUAL_INSPECTION,
            "The return has high risk and should be inspected manually."
        )

    if estimated_loss >= 10000:
        return (
            Recommendation.SENIOR_REVIEW,
            "The return has critical risk and high financial exposure."
        )

    return (
        Recommendation.MANUAL_INSPECTION,
        "The return has critical risk and requires mandatory inspection."
    )

from uuid import uuid4

from backend.app.schemas.return_schema import ReturnAssessment


def assess_return(data: ReturnCreate) -> ReturnAssessment:
    risk_score, factors = calculate_risk(data)

    financial_impact = calculate_financial_impact(data)

    recommendation, recommendation_reason = determine_recommendation(
        score=risk_score,
        estimated_loss=financial_impact.estimated_loss,
        data=data
    )

    confidence = 0.90

    if not data.duplicate_image_detected and not data.image_mismatch_detected:
        confidence -= 0.10

    if data.customer_history.total_orders < 3:
        confidence -= 0.15

    confidence = round(max(0.40, min(confidence, 0.95)), 2)

    return ReturnAssessment(
        return_id=f"ret_{uuid4().hex[:12]}",
        risk_score=risk_score,
        risk_level=determine_risk_level(risk_score),
        confidence=confidence,
        factors=factors,
        recommendation=recommendation,
        recommendation_reason=recommendation_reason,
        human_review_required=risk_score >= 60,
        automatic_rejection_allowed=False,
        financial_impact=financial_impact
    )

