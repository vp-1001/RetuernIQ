from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.api.dependencies import require_roles
from backend.app.database.session import get_db
from backend.app.models.user_model import User
from backend.app.schemas.intelligence_schema import KPIOverview
from backend.app.services.kpi_service import build_kpi_overview

router = APIRouter(prefix="/kpis", tags=["Merchant KPIs"])


@router.get("/overview", response_model=KPIOverview)
def get_kpi_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "merchant", "reviewer")
    ),
) -> KPIOverview:
    return build_kpi_overview(db)
