from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from backend.app.models.merchant_settings_model import MerchantSettings
from backend.app.schemas.merchant_settings_schema import (
    AutomationSettingsUpdate,
    CategoryRulesUpdate,
    EvidenceSettingsUpdate,
    MerchantProfileUpdate,
    MerchantSettingsResponse,
    MerchantSettingsUpdate,
    NotificationSettingsUpdate,
    RiskSettingsUpdate,
)


DEFAULT_SETTINGS = {
    "business_name": "ReturnIQ Merchant",
    "support_email": "",
    "support_phone": "",
    "website_url": "",
    "timezone": "Asia/Kolkata",
    "currency": "INR",
    "low_risk_max": 29,
    "medium_risk_max": 59,
    "high_risk_max": 79,
    "human_review_threshold": 60,
    "auto_approval_enabled": True,
    "auto_approval_max_score": 25,
    "auto_approval_max_amount": 2500.0,
    "auto_rejection_enabled": False,
    "auto_rejection_min_score": 90,
    "require_evidence": True,
    "evidence_minimum_images": 1,
    "evidence_required_above_amount": 3000.0,
    "allow_jpeg": True,
    "allow_png": True,
    "allow_webp": True,
    "maximum_upload_size_mb": 10,
    "email_notifications": True,
    "high_risk_alerts": True,
    "review_assignment_alerts": True,
    "daily_summary_enabled": True,
    "weekly_report_enabled": False,
    "notification_email": "",
    "default_return_window_days": 30,
    "returnless_refund_enabled": False,
    "returnless_refund_max_amount": 500.0,
    "manual_override_enabled": True,
    "require_override_remarks": True,
    "product_category_rules": {},
}


def _get_settings_record(
    db: Session,
    owner_id: str,
) -> MerchantSettings | None:
    statement = select(MerchantSettings).where(
        MerchantSettings.owner_id == owner_id
    )
    return db.execute(statement).scalar_one_or_none()


def _build_default_values(email: str | None = None) -> dict:
    values = DEFAULT_SETTINGS.copy()
    values["product_category_rules"] = {}

    if email:
        values["support_email"] = email
        values["notification_email"] = email

    return values


def get_or_create_merchant_settings(
    db: Session,
    owner_id: str,
    owner_email: str | None = None,
) -> MerchantSettings:
    existing_settings = _get_settings_record(db, owner_id)

    if existing_settings is not None:
        return existing_settings

    settings = MerchantSettings(
        owner_id=owner_id,
        **_build_default_values(owner_email),
    )

    try:
        db.add(settings)
        db.commit()
        db.refresh(settings)
        return settings

    except IntegrityError:
        db.rollback()
        existing_settings = _get_settings_record(db, owner_id)
        if existing_settings is not None:
            return existing_settings
        raise

    except SQLAlchemyError:
        db.rollback()
        raise


def _update_settings_fields(
    db: Session,
    settings: MerchantSettings,
    values: dict,
) -> MerchantSettings:
    for field_name, field_value in values.items():
        if hasattr(settings, field_name):
            setattr(settings, field_name, field_value)

    try:
        db.add(settings)
        db.commit()
        db.refresh(settings)
        return settings

    except SQLAlchemyError:
        db.rollback()
        raise


def _update(
    db: Session,
    owner_id: str,
    owner_email: str | None,
    payload,
) -> MerchantSettings:
    settings = get_or_create_merchant_settings(
        db,
        owner_id,
        owner_email,
    )
    return _update_settings_fields(
        db,
        settings,
        payload.model_dump(),
    )


def update_all_settings(db, owner_id, owner_email, payload: MerchantSettingsUpdate):
    return _update(db, owner_id, owner_email, payload)


def update_merchant_profile(db, owner_id, owner_email, payload: MerchantProfileUpdate):
    return _update(db, owner_id, owner_email, payload)


def update_risk_settings(db, owner_id, owner_email, payload: RiskSettingsUpdate):
    return _update(db, owner_id, owner_email, payload)


def update_automation_settings(
    db,
    owner_id,
    owner_email,
    payload: AutomationSettingsUpdate,
):
    return _update(db, owner_id, owner_email, payload)


def update_evidence_settings(
    db,
    owner_id,
    owner_email,
    payload: EvidenceSettingsUpdate,
):
    return _update(db, owner_id, owner_email, payload)


def update_notification_settings(
    db,
    owner_id,
    owner_email,
    payload: NotificationSettingsUpdate,
):
    return _update(db, owner_id, owner_email, payload)


def update_category_rules(
    db,
    owner_id,
    owner_email,
    payload: CategoryRulesUpdate,
):
    return _update(db, owner_id, owner_email, payload)


def reset_merchant_settings(
    db: Session,
    owner_id: str,
    owner_email: str | None,
) -> MerchantSettings:
    settings = get_or_create_merchant_settings(
        db,
        owner_id,
        owner_email,
    )
    return _update_settings_fields(
        db,
        settings,
        _build_default_values(owner_email),
    )


def serialize_merchant_settings(
    settings: MerchantSettings,
) -> MerchantSettingsResponse:
    return MerchantSettingsResponse.model_validate(settings)
