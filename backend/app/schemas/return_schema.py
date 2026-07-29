from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductCategory(str, Enum):
    ELECTRONICS = "electronics"
    FASHION = "fashion"
    FOOTWEAR = "footwear"
    BEAUTY = "beauty"
    HOME = "home"
    OTHER = "other"


class CustomerHistory(BaseModel):
    total_orders: int = Field(ge=0)
    total_returns: int = Field(ge=0)
    account_age_days: int = Field(ge=0)
    repeated_damage_claims: int = Field(default=0, ge=0)


class FinancialData(BaseModel):
    refund_amount: float = Field(ge=0)
    reverse_shipping_cost: float = Field(default=0, ge=0)
    inspection_cost: float = Field(default=0, ge=0)
    repair_cost: float = Field(default=0, ge=0)
    disposal_cost: float = Field(default=0, ge=0)
    recoverable_resale_value: float = Field(default=0, ge=0)


class ReturnCreate(BaseModel):
    merchant_id: str = Field(min_length=1)
    external_return_id: str = Field(min_length=1)
    order_id: str = Field(min_length=1)
    customer_id: str = Field(min_length=1)

    product_name: str = Field(min_length=1)
    product_category: ProductCategory
    product_price: float = Field(gt=0)

    return_reason: str = Field(min_length=3)
    days_after_delivery: int = Field(ge=0)

    missing_accessories: bool = False
    duplicate_image_detected: bool = False
    image_mismatch_detected: bool = False

    customer_history: CustomerHistory
    financial_data: FinancialData

    @field_validator(
        "merchant_id",
        "external_return_id",
        "order_id",
        "customer_id",
        "product_name",
        "return_reason",
        mode="before",
    )
    @classmethod
    def clean_text_fields(cls, value):
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("product_category", mode="before")
    @classmethod
    def normalize_product_category(cls, value):
        if isinstance(value, ProductCategory):
            return value

        if not isinstance(value, str):
            return value

        normalized_value = value.strip().lower()

        aliases = {
            "electronic": "electronics",
            "electronics": "electronics",
            "fashion": "fashion",
            "clothing": "fashion",
            "clothes": "fashion",
            "footwear": "footwear",
            "shoe": "footwear",
            "shoes": "footwear",
            "beauty": "beauty",
            "cosmetics": "beauty",
            "home": "home",
            "home appliance": "home",
            "home appliances": "home",
            "other": "other",
            "others": "other",
        }

        return aliases.get(normalized_value, normalized_value)


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Recommendation(str, Enum):
    INSTANT_REFUND = "instant_refund"
    APPROVE_REFUND = "approve_refund"
    REQUEST_EVIDENCE = "request_evidence"
    MANUAL_INSPECTION = "manual_inspection"
    SENIOR_REVIEW = "senior_review"


class RiskFactor(BaseModel):
    name: str
    impact: int
    explanation: str


class FinancialImpact(BaseModel):
    estimated_loss: float
    refund_amount: float
    operational_cost: float
    recoverable_value: float


class ReturnAssessment(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    return_id: str
    risk_score: int
    risk_level: RiskLevel
    confidence: float

    factors: list[RiskFactor]

    recommendation: Recommendation
    recommendation_reason: str

    human_review_required: bool
    automatic_rejection_allowed: bool

    financial_impact: FinancialImpact