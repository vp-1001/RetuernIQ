import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.database.base import Base


class MerchantSettings(Base):
    __tablename__ = "merchant_settings"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    owner_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    business_name: Mapped[str] = mapped_column(
        String(255),
        default="ReturnIQ Merchant",
        nullable=False,
    )
    support_email: Mapped[str] = mapped_column(
        String(255),
        default="",
        nullable=False,
    )
    support_phone: Mapped[str] = mapped_column(
        String(30),
        default="",
        nullable=False,
    )
    website_url: Mapped[str] = mapped_column(
        String(500),
        default="",
        nullable=False,
    )
    timezone: Mapped[str] = mapped_column(
        String(100),
        default="Asia/Kolkata",
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(
        String(10),
        default="INR",
        nullable=False,
    )

    low_risk_max: Mapped[int] = mapped_column(
        Integer,
        default=29,
        nullable=False,
    )
    medium_risk_max: Mapped[int] = mapped_column(
        Integer,
        default=59,
        nullable=False,
    )
    high_risk_max: Mapped[int] = mapped_column(
        Integer,
        default=79,
        nullable=False,
    )
    human_review_threshold: Mapped[int] = mapped_column(
        Integer,
        default=60,
        nullable=False,
    )

    auto_approval_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    auto_approval_max_score: Mapped[int] = mapped_column(
        Integer,
        default=25,
        nullable=False,
    )
    auto_approval_max_amount: Mapped[float] = mapped_column(
        Float,
        default=2500.0,
        nullable=False,
    )
    auto_rejection_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    auto_rejection_min_score: Mapped[int] = mapped_column(
        Integer,
        default=90,
        nullable=False,
    )

    require_evidence: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    evidence_minimum_images: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )
    evidence_required_above_amount: Mapped[float] = mapped_column(
        Float,
        default=3000.0,
        nullable=False,
    )
    allow_jpeg: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    allow_png: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    allow_webp: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    maximum_upload_size_mb: Mapped[int] = mapped_column(
        Integer,
        default=10,
        nullable=False,
    )

    email_notifications: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    high_risk_alerts: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    review_assignment_alerts: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    daily_summary_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    weekly_report_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    notification_email: Mapped[str] = mapped_column(
        String(255),
        default="",
        nullable=False,
    )

    default_return_window_days: Mapped[int] = mapped_column(
        Integer,
        default=30,
        nullable=False,
    )
    returnless_refund_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    returnless_refund_max_amount: Mapped[float] = mapped_column(
        Float,
        default=500.0,
        nullable=False,
    )
    manual_override_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    require_override_remarks: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    product_category_rules: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
