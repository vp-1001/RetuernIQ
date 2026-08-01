from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from backend.app.api.dependencies import require_merchant
from backend.app.database.session import get_db
from backend.app.models.user_model import User
from backend.app.schemas.merchant_settings_schema import (
    AutomationSettingsUpdate,
    CategoryRulesUpdate,
    EvidenceSettingsUpdate,
    MerchantProfileUpdate,
    MerchantSettingsResponse,
    MerchantSettingsUpdate,
    NotificationSettingsUpdate,
    RiskSettingsUpdate,
    SettingsResetResponse,
)
from backend.app.services.merchant_settings_service import (
    get_or_create_merchant_settings,
    reset_merchant_settings,
    serialize_merchant_settings,
    update_all_settings,
    update_automation_settings,
    update_category_rules,
    update_evidence_settings,
    update_merchant_profile,
    update_notification_settings,
    update_risk_settings,
)


router = APIRouter(
    prefix="/settings",
    tags=["Merchant Settings"],
)


def _email(user: User) -> str | None:
    return user.email if isinstance(user.email, str) else None


def _server_error(message: str, error: SQLAlchemyError):
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=message,
    ) from error


@router.get("", response_model=MerchantSettingsResponse)
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_merchant),
):
    try:
        settings = get_or_create_merchant_settings(
            db,
            current_user.id,
            _email(current_user),
        )
        return serialize_merchant_settings(settings)
    except SQLAlchemyError as error:
        _server_error("Unable to load merchant settings.", error)


@router.put("", response_model=MerchantSettingsResponse)
def replace_settings(
    payload: MerchantSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_merchant),
):
    try:
        settings = update_all_settings(
            db,
            current_user.id,
            _email(current_user),
            payload,
        )
        return serialize_merchant_settings(settings)
    except SQLAlchemyError as error:
        _server_error("Unable to update merchant settings.", error)


@router.patch("/profile", response_model=MerchantSettingsResponse)
def update_profile(
    payload: MerchantProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_merchant),
):
    try:
        settings = update_merchant_profile(
            db,
            current_user.id,
            _email(current_user),
            payload,
        )
        return serialize_merchant_settings(settings)
    except SQLAlchemyError as error:
        _server_error("Unable to update merchant profile.", error)


@router.patch("/risk", response_model=MerchantSettingsResponse)
def update_risk(
    payload: RiskSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_merchant),
):
    try:
        settings = update_risk_settings(
            db,
            current_user.id,
            _email(current_user),
            payload,
        )
        return serialize_merchant_settings(settings)
    except SQLAlchemyError as error:
        _server_error("Unable to update risk settings.", error)


@router.patch("/automation", response_model=MerchantSettingsResponse)
def update_automation(
    payload: AutomationSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_merchant),
):
    try:
        settings = update_automation_settings(
            db,
            current_user.id,
            _email(current_user),
            payload,
        )
        return serialize_merchant_settings(settings)
    except SQLAlchemyError as error:
        _server_error("Unable to update automation settings.", error)


@router.patch("/evidence", response_model=MerchantSettingsResponse)
def update_evidence(
    payload: EvidenceSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_merchant),
):
    try:
        settings = update_evidence_settings(
            db,
            current_user.id,
            _email(current_user),
            payload,
        )
        return serialize_merchant_settings(settings)
    except SQLAlchemyError as error:
        _server_error("Unable to update evidence settings.", error)


@router.patch("/notifications", response_model=MerchantSettingsResponse)
def update_notifications(
    payload: NotificationSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_merchant),
):
    try:
        settings = update_notification_settings(
            db,
            current_user.id,
            _email(current_user),
            payload,
        )
        return serialize_merchant_settings(settings)
    except SQLAlchemyError as error:
        _server_error("Unable to update notification settings.", error)


@router.patch("/category-rules", response_model=MerchantSettingsResponse)
def update_categories(
    payload: CategoryRulesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_merchant),
):
    try:
        settings = update_category_rules(
            db,
            current_user.id,
            _email(current_user),
            payload,
        )
        return serialize_merchant_settings(settings)
    except SQLAlchemyError as error:
        _server_error("Unable to update category rules.", error)


@router.post("/reset", response_model=SettingsResetResponse)
def reset_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_merchant),
):
    try:
        settings = reset_merchant_settings(
            db,
            current_user.id,
            _email(current_user),
        )
        return SettingsResetResponse(
            message="Merchant settings restored to defaults.",
            settings=serialize_merchant_settings(settings),
        )
    except SQLAlchemyError as error:
        _server_error("Unable to reset merchant settings.", error)
