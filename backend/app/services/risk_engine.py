from uuid import uuid4

from backend.app.models.merchant_settings_model import MerchantSettings
from backend.app.schemas.return_schema import (
    FinancialImpact,
    Recommendation,
    ReturnAssessment,
    ReturnCreate,
    RiskFactor,
    RiskLevel,
)


def calculate_financial_impact(
    data: ReturnCreate,
) -> FinancialImpact:
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
        recoverable_value=round(
            financial.recoverable_resale_value,
            2,
        ),
    )


def determine_risk_level(
    score: int,
    settings: MerchantSettings,
) -> RiskLevel:
    if score <= settings.low_risk_max:
        return RiskLevel.LOW

    if score <= settings.medium_risk_max:
        return RiskLevel.MEDIUM

    if score <= settings.high_risk_max:
        return RiskLevel.HIGH

    return RiskLevel.CRITICAL


def calculate_risk(
    data: ReturnCreate,
) -> tuple[int, list[RiskFactor]]:
    score = 0
    factors: list[RiskFactor] = []

    history = data.customer_history

    return_rate = (
        history.total_returns / history.total_orders
        if history.total_orders > 0
        else 0
    )

    if return_rate >= 0.60:
        score += 25
        factors.append(
            RiskFactor(
                name="High Return Rate",
                impact=25,
                explanation=(
                    "Customer has returned more than 60% "
                    "of previous orders."
                ),
            )
        )

    if data.product_price >= 20000:
        score += 15
        factors.append(
            RiskFactor(
                name="High Value Product",
                impact=15,
                explanation=(
                    "Expensive products carry higher fraud risk."
                ),
            )
        )

    if data.days_after_delivery >= 13:
        score += 10
        factors.append(
            RiskFactor(
                name="Late Return",
                impact=10,
                explanation=(
                    "Return requested near the end of the "
                    "return window."
                ),
            )
        )

    if data.missing_accessories:
        score += 20
        factors.append(
            RiskFactor(
                name="Missing Accessories",
                impact=20,
                explanation="Expected accessories are missing.",
            )
        )

    if data.duplicate_image_detected:
        score += 30
        factors.append(
            RiskFactor(
                name="Duplicate Image",
                impact=30,
                explanation=(
                    "Uploaded evidence appears duplicated."
                ),
            )
        )

    if data.image_mismatch_detected:
        score += 25
        factors.append(
            RiskFactor(
                name="Image Mismatch",
                impact=25,
                explanation=(
                    "Uploaded image may not match the ordered product."
                ),
            )
        )

    if history.repeated_damage_claims >= 2:
        score += 15
        factors.append(
            RiskFactor(
                name="Repeated Damage Claims",
                impact=15,
                explanation=(
                    "Customer has submitted repeated damage claims."
                ),
            )
        )

    if (
        history.account_age_days >= 730
        and return_rate < 0.20
    ):
        score -= 15
        factors.append(
            RiskFactor(
                name="Trusted Customer",
                impact=-15,
                explanation=(
                    "Long account history with very few returns."
                ),
            )
        )

    score = max(0, min(score, 100))

    return score, factors


def determine_recommendation(
    score: int,
    estimated_loss: float,
    data: ReturnCreate,
    settings: MerchantSettings,
) -> tuple[Recommendation, str, bool]:
    refund_amount = data.financial_data.refund_amount

    if (
        settings.auto_rejection_enabled
        and score >= settings.auto_rejection_min_score
    ):
        return (
            Recommendation.SENIOR_REVIEW,
            "The request meets the merchant's automatic-rejection "
            "threshold and requires a final controlled review.",
            True,
        )

    if (
        settings.returnless_refund_enabled
        and score <= settings.auto_approval_max_score
        and refund_amount
        <= settings.returnless_refund_max_amount
    ):
        return (
            Recommendation.INSTANT_REFUND,
            "The request qualifies for the merchant's "
            "returnless-refund policy.",
            False,
        )

    if (
        settings.auto_approval_enabled
        and score <= settings.auto_approval_max_score
        and refund_amount <= settings.auto_approval_max_amount
    ):
        return (
            Recommendation.APPROVE_REFUND,
            "The request meets the merchant's automatic-approval "
            "risk and refund limits.",
            False,
        )

    risk_level = determine_risk_level(score, settings)

    if risk_level == RiskLevel.LOW:
        return (
            Recommendation.APPROVE_REFUND,
            "The return is within the merchant's low-risk range.",
            False,
        )

    if risk_level == RiskLevel.MEDIUM:
        return (
            Recommendation.REQUEST_EVIDENCE,
            "The return is within the merchant's moderate-risk "
            "range, so additional evidence is required.",
            False,
        )

    if risk_level == RiskLevel.HIGH:
        return (
            Recommendation.MANUAL_INSPECTION,
            "The return is within the merchant's high-risk range "
            "and should be inspected manually.",
            False,
        )

    if estimated_loss >= 10000:
        return (
            Recommendation.SENIOR_REVIEW,
            "The return has critical risk and high financial exposure.",
            False,
        )

    return (
        Recommendation.MANUAL_INSPECTION,
        "The return has critical risk and requires mandatory inspection.",
        False,
    )


def assess_return(
    data: ReturnCreate,
    settings: MerchantSettings,
) -> ReturnAssessment:
    risk_score, factors = calculate_risk(data)
    financial_impact = calculate_financial_impact(data)

    (
        recommendation,
        recommendation_reason,
        automatic_rejection_allowed,
    ) = determine_recommendation(
        score=risk_score,
        estimated_loss=financial_impact.estimated_loss,
        data=data,
        settings=settings,
    )

    confidence = 0.90

    if (
        not data.duplicate_image_detected
        and not data.image_mismatch_detected
    ):
        confidence -= 0.10

    if data.customer_history.total_orders < 3:
        confidence -= 0.15

    confidence = round(
        max(0.40, min(confidence, 0.95)),
        2,
    )

    human_review_required = (
        risk_score >= settings.human_review_threshold
        or recommendation
        in {
            Recommendation.MANUAL_INSPECTION,
            Recommendation.SENIOR_REVIEW,
        }
    )

    return ReturnAssessment(
        return_id=f"ret_{uuid4().hex[:12]}",
        risk_score=risk_score,
        risk_level=determine_risk_level(
            risk_score,
            settings,
        ),
        confidence=confidence,
        factors=factors,
        recommendation=recommendation,
        recommendation_reason=recommendation_reason,
        human_review_required=human_review_required,
        automatic_rejection_allowed=(
            automatic_rejection_allowed
        ),
        financial_impact=financial_impact,
    )
