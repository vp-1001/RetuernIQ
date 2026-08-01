from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


class MerchantProfileUpdate(BaseModel):
    business_name: str = Field(min_length=2, max_length=255)
    support_email: str = Field(default="", max_length=255)
    support_phone: str = Field(default="", max_length=30)
    website_url: str = Field(default="", max_length=500)
    timezone: str = Field(
        default="Asia/Kolkata",
        min_length=2,
        max_length=100,
    )
    currency: str = Field(
        default="INR",
        min_length=3,
        max_length=10,
    )

    @field_validator(
        "business_name",
        "support_email",
        "support_phone",
        "website_url",
        "timezone",
        "currency",
        mode="before",
    )
    @classmethod
    def strip_profile_strings(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.upper()


class RiskSettingsUpdate(BaseModel):
    low_risk_max: int = Field(default=29, ge=0, le=100)
    medium_risk_max: int = Field(default=59, ge=0, le=100)
    high_risk_max: int = Field(default=79, ge=0, le=100)
    human_review_threshold: int = Field(default=60, ge=0, le=100)

    @model_validator(mode="after")
    def validate_risk_boundaries(self):
        if not (
            self.low_risk_max
            < self.medium_risk_max
            < self.high_risk_max
        ):
            raise ValueError(
                "Risk boundaries must satisfy low < medium < high."
            )
        return self


class AutomationSettingsUpdate(BaseModel):
    auto_approval_enabled: bool = True
    auto_approval_max_score: int = Field(default=25, ge=0, le=100)
    auto_approval_max_amount: float = Field(default=2500.0, ge=0)
    auto_rejection_enabled: bool = False
    auto_rejection_min_score: int = Field(default=90, ge=0, le=100)
    returnless_refund_enabled: bool = False
    returnless_refund_max_amount: float = Field(default=500.0, ge=0)
    default_return_window_days: int = Field(default=30, ge=1, le=365)
    manual_override_enabled: bool = True
    require_override_remarks: bool = True

    @model_validator(mode="after")
    def validate_automation_thresholds(self):
        if (
            self.auto_approval_enabled
            and self.auto_rejection_enabled
            and self.auto_approval_max_score
            >= self.auto_rejection_min_score
        ):
            raise ValueError(
                "Auto-approval score must be lower than "
                "the auto-rejection score."
            )
        return self


class EvidenceSettingsUpdate(BaseModel):
    require_evidence: bool = True
    evidence_minimum_images: int = Field(default=1, ge=0, le=20)
    evidence_required_above_amount: float = Field(default=3000.0, ge=0)
    allow_jpeg: bool = True
    allow_png: bool = True
    allow_webp: bool = True
    maximum_upload_size_mb: int = Field(default=10, ge=1, le=50)

    @model_validator(mode="after")
    def validate_file_formats(self):
        if not (self.allow_jpeg or self.allow_png or self.allow_webp):
            raise ValueError(
                "At least one evidence image format must be enabled."
            )

        if self.require_evidence and self.evidence_minimum_images < 1:
            raise ValueError(
                "At least one image is required when evidence is mandatory."
            )
        return self


class NotificationSettingsUpdate(BaseModel):
    email_notifications: bool = True
    high_risk_alerts: bool = True
    review_assignment_alerts: bool = True
    daily_summary_enabled: bool = True
    weekly_report_enabled: bool = False
    notification_email: str = Field(default="", max_length=255)

    @field_validator("notification_email", mode="before")
    @classmethod
    def strip_notification_email(cls, value):
        return value.strip() if isinstance(value, str) else value


class CategoryRulesUpdate(BaseModel):
    product_category_rules: dict = Field(default_factory=dict)


class MerchantSettingsUpdate(
    MerchantProfileUpdate,
    RiskSettingsUpdate,
    AutomationSettingsUpdate,
    EvidenceSettingsUpdate,
    NotificationSettingsUpdate,
    CategoryRulesUpdate,
):
    pass


class MerchantSettingsResponse(MerchantSettingsUpdate):
    model_config = ConfigDict(from_attributes=True)

    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime


class SettingsResetResponse(BaseModel):
    message: str
    settings: MerchantSettingsResponse
