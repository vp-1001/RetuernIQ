from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.api.dependencies import require_roles
from backend.app.database.session import get_db
from backend.app.models.user_model import User
from backend.app.schemas.intelligence_schema import (
    MerchantIntelligenceDashboard,
)
from backend.app.services.merchant_intelligence_service import (
    build_merchant_intelligence,
)

router = APIRouter(
    prefix="/merchant-intelligence",
    tags=["Merchant Intelligence"],
)


@router.get("/dashboard", response_model=MerchantIntelligenceDashboard)
def get_merchant_intelligence(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "merchant", "reviewer")
    ),
) -> MerchantIntelligenceDashboard:
    return build_merchant_intelligence(
        db=db,
        owner_id=current_user.id,
        owner_email=current_user.email,
    )
