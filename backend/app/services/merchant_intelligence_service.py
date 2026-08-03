from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.return_model import ReturnRequest
from backend.app.models.merchant_settings_model import MerchantSettings
from backend.app.schemas.intelligence_schema import (
    CustomerRiskInsight,
    MerchantIntelligenceDashboard,
    ProductReturnInsight,
    RulePreview,
)
from backend.app.services.analytics_service import (
    _refund_amount,
    normalize_status,
)
from backend.app.services.kpi_service import build_kpi_overview
from backend.app.services.merchant_settings_service import (
    get_or_create_merchant_settings,
)


def build_merchant_intelligence(
    db: Session,
    owner_id: str,
    owner_email: str | None,
) -> MerchantIntelligenceDashboard:
    returns = db.execute(
        select(ReturnRequest)
    ).scalars().all()

    customer_data = defaultdict(
        lambda: {
            "total": 0,
            "high": 0,
            "rejected": 0,
            "risk": 0.0,
            "refund": 0.0,
        }
    )

    product_data = defaultdict(
        lambda: {
            "total": 0,
            "high": 0,
            "rejected": 0,
            "risk": 0.0,
            "refund": 0.0,
        }
    )

    for item in returns:
        is_high = (
            item.risk_score >= 70
            or item.risk_level.lower() in {"high", "critical"}
        )
        rejected = normalize_status(item.status) == "rejected"
        refund = _refund_amount(item)

        customer = customer_data[item.customer_id]
        customer["total"] += 1
        customer["high"] += int(is_high)
        customer["rejected"] += int(rejected)
        customer["risk"] += item.risk_score
        customer["refund"] += refund

        product = product_data[item.product_name]
        product["total"] += 1
        product["high"] += int(is_high)
        product["rejected"] += int(rejected)
        product["risk"] += item.risk_score
        product["refund"] += refund

    top_customers = []
    for customer_id, values in customer_data.items():
        total = values["total"]
        average_risk = values["risk"] / total if total else 0
        risk_rank = (
            average_risk
            + values["high"] * 10
            + values["rejected"] * 15
        )
        top_customers.append(
            CustomerRiskInsight(
                customer_id=customer_id,
                total_returns=total,
                high_risk_returns=values["high"],
                rejected_returns=values["rejected"],
                average_risk_score=round(average_risk, 2),
                refund_exposure=round(values["refund"], 2),
                risk_rank=round(risk_rank, 2),
            )
        )

    top_customers.sort(
        key=lambda item: item.risk_rank,
        reverse=True,
    )

    top_products = []
    for product_name, values in product_data.items():
        total = values["total"]
        average_risk = values["risk"] / total if total else 0
        top_products.append(
            ProductReturnInsight(
                product_name=product_name,
                total_returns=total,
                high_risk_returns=values["high"],
                rejected_returns=values["rejected"],
                average_risk_score=round(average_risk, 2),
                refund_exposure=round(values["refund"], 2),
            )
        )

    top_products.sort(
        key=lambda item: (
            item.total_returns,
            item.high_risk_returns,
        ),
        reverse=True,
    )

    settings = get_or_create_merchant_settings(
        db=db,
        owner_id=owner_id,
        owner_email=owner_email,
    )

    rules = RulePreview(
        human_review_threshold=settings.human_review_threshold,
        auto_approval_enabled=settings.auto_approval_enabled,
        auto_approval_max_score=settings.auto_approval_max_score,
        auto_rejection_enabled=settings.auto_rejection_enabled,
        auto_rejection_min_score=settings.auto_rejection_min_score,
        require_evidence=settings.require_evidence,
        evidence_minimum_images=settings.evidence_minimum_images,
        manual_override_enabled=settings.manual_override_enabled,
        require_override_remarks=settings.require_override_remarks,
        category_rules=settings.product_category_rules or {},
    )

    return MerchantIntelligenceDashboard(
        kpis=build_kpi_overview(db),
        top_risky_customers=top_customers[:10],
        top_returned_products=top_products[:10],
        rules=rules,
    )
