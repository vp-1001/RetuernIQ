from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.api.dependencies import (
    require_roles,
)
from backend.app.database.session import (
    get_db,
)
from backend.app.models.evidence_ai_model import (
    EvidenceAIAnalysis,
)
from backend.app.models.evidence_model import (
    Evidence,
)
from backend.app.models.return_model import (
    ReturnRequest,
)
from backend.app.models.user_model import User
from backend.app.schemas.evidence_ai_schema import (
    AIAnalyticsResponse,
    AIHealthResponse,
    EvidenceAIAnalysisResponse,
    ReturnEvidenceSummary,
)
from backend.app.services.evidence_ai_service import (
    _serialise_analysis,
    ai_analytics,
    analyze_evidence,
    return_summary,
    runtime_status,
)


router = APIRouter(
    prefix="/ai/evidence",
    tags=["AI Evidence Intelligence"],
)


AI_ROLES = require_roles(
    "admin",
    "merchant",
    "reviewer",
)


@router.get(
    "/health",
    response_model=AIHealthResponse,
)
def health(
    current_user: User = Depends(AI_ROLES),
):
    return AIHealthResponse(
        **runtime_status()
    )


@router.get(
    "/analytics",
    response_model=AIAnalyticsResponse,
)
def analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(AI_ROLES),
):
    return AIAnalyticsResponse(
        **ai_analytics(db)
    )


@router.post(
    "/{evidence_id}/analyze",
    response_model=EvidenceAIAnalysisResponse,
)
def analyze_one(
    evidence_id: str,
    force: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(AI_ROLES),
):
    evidence = db.get(
        Evidence,
        evidence_id,
    )

    if evidence is None:
        raise HTTPException(
            status_code=404,
            detail="Evidence not found.",
        )

    return_request = db.get(
        ReturnRequest,
        evidence.return_id,
    )

    if return_request is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Return request not found."
            ),
        )

    try:
        analysis = analyze_evidence(
            db,
            evidence,
            return_request,
            force,
        )

        return (
            EvidenceAIAnalysisResponse
            .model_validate(
                _serialise_analysis(
                    analysis
                )
            )
        )

    except RuntimeError as error:
        raise HTTPException(
            status_code=(
                status
                .HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail=str(error),
        ) from error

    except FileNotFoundError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        ) from error


@router.get(
    "/{evidence_id}",
    response_model=EvidenceAIAnalysisResponse,
)
def get_analysis(
    evidence_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AI_ROLES),
):
    analysis = db.scalar(
        select(EvidenceAIAnalysis).where(
            EvidenceAIAnalysis.evidence_id
            == evidence_id
        )
    )

    if analysis is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Evidence has not been "
                "analyzed."
            ),
        )

    return (
        EvidenceAIAnalysisResponse
        .model_validate(
            _serialise_analysis(analysis)
        )
    )


@router.post(
    "/return/{return_id}/analyze",
    response_model=ReturnEvidenceSummary,
)
def analyze_return(
    return_id: str,
    force: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(AI_ROLES),
):
    return_request = db.get(
        ReturnRequest,
        return_id,
    )

    if return_request is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Return request not found."
            ),
        )

    evidence_items = db.scalars(
        select(Evidence).where(
            Evidence.return_id
            == return_id
        )
    ).all()

    if not evidence_items:
        raise HTTPException(
            status_code=400,
            detail=(
                "Upload at least one evidence "
                "image before AI analysis."
            ),
        )

    try:
        for evidence in evidence_items:
            analyze_evidence(
                db,
                evidence,
                return_request,
                force,
            )

        return (
            ReturnEvidenceSummary
            .model_validate(
                return_summary(
                    db,
                    return_request,
                )
            )
        )

    except RuntimeError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error


@router.get(
    "/return/{return_id}",
    response_model=ReturnEvidenceSummary,
)
def get_return_summary(
    return_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(AI_ROLES),
):
    return_request = db.get(
        ReturnRequest,
        return_id,
    )

    if return_request is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Return request not found."
            ),
        )

    return (
        ReturnEvidenceSummary.model_validate(
            return_summary(
                db,
                return_request,
            )
        )
    )
