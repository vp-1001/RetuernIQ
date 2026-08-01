from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from backend.app.api.dependencies import require_roles
from backend.app.database.session import get_db
from backend.app.models.evidence_model import Evidence
from backend.app.models.return_model import ReturnRequest
from backend.app.models.user_model import User
from backend.app.schemas.review_schema import (
    ReviewDecisionCreate,
    ReviewDecisionResponse,
    ReviewDetailResponse,
    ReviewQueueItem,
    ReviewQueueSummary,
)
from backend.app.services.merchant_settings_service import (
    get_or_create_merchant_settings,
)
from backend.app.services.review_service import (
    create_review_decision,
    get_review_detail,
    get_review_summary,
    list_review_history,
    list_review_queue,
)


router = APIRouter(
    prefix="/reviews",
    tags=["Human Review"],
)


@router.get(
    "/summary",
    response_model=ReviewQueueSummary,
)
def review_queue_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "merchant",
            "reviewer",
        )
    ),
) -> ReviewQueueSummary:
    return get_review_summary(db)


@router.get(
    "",
    response_model=list[ReviewQueueItem],
)
def get_review_queue(
    review_status: str | None = Query(
        default=None,
        alias="status",
    ),
    risk_level: str | None = Query(
        default=None,
    ),
    search: str | None = Query(
        default=None,
        max_length=200,
    ),
    skip: int = Query(
        default=0,
        ge=0,
    ),
    limit: int = Query(
        default=50,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "merchant",
            "reviewer",
        )
    ),
) -> list[ReviewQueueItem]:
    try:
        return list_review_queue(
            db=db,
            review_status=review_status,
            risk_level=risk_level,
            search=search,
            skip=skip,
            limit=limit,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.get(
    "/history",
    response_model=list[ReviewDecisionResponse],
)
def get_decision_history(
    return_id: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "merchant",
            "reviewer",
        )
    ),
) -> list[ReviewDecisionResponse]:
    return list_review_history(
        db=db,
        return_id=return_id,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{return_id}",
    response_model=ReviewDetailResponse,
)
def get_return_review(
    return_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "merchant",
            "reviewer",
        )
    ),
) -> ReviewDetailResponse:
    review_detail = get_review_detail(
        db,
        return_id,
    )

    if review_detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Return request not found.",
        )

    return review_detail


@router.post(
    "/{return_id}/decision",
    response_model=ReviewDecisionResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_review_decision(
    return_id: str,
    decision_data: ReviewDecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "merchant",
            "reviewer",
        )
    ),
) -> ReviewDecisionResponse:
    return_request = db.get(
        ReturnRequest,
        return_id,
    )

    if return_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Return request not found.",
        )

    settings = get_or_create_merchant_settings(
        db=db,
        owner_id=current_user.id,
        owner_email=current_user.email,
    )

    evidence_count = db.scalar(
        select(func.count(Evidence.id)).where(
            Evidence.return_id == return_id
        )
    ) or 0

    try:
        return create_review_decision(
            db=db,
            return_request=return_request,
            reviewer=current_user,
            decision_data=decision_data,
            settings=settings,
            evidence_count=evidence_count,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save the review decision.",
        ) from error