import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.database.session import get_db
from app.models.return_model import ReturnRequest
from app.models.user_model import User
from app.schemas.return_schema import ReturnAssessment, ReturnCreate
from app.services.risk_engine import assess_return


router = APIRouter(
    prefix="/returns",
    tags=["Returns"],
)


def build_assessment_response(
    return_request: ReturnRequest,
) -> ReturnAssessment:
    assessment_data = dict(return_request.assessment_payload)
    assessment_data["return_id"] = return_request.id

    return ReturnAssessment.model_validate(assessment_data)


@router.post(
    "",
    response_model=ReturnAssessment,
    status_code=status.HTTP_201_CREATED,
)
def create_return(
    return_data: ReturnCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "merchant",
        )
    ),
) -> ReturnAssessment:
    existing_return = db.scalar(
        select(ReturnRequest).where(
            ReturnRequest.order_id == return_data.order_id
        )
    )

    if existing_return is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A return request already exists for this order.",
        )

    assessment = assess_return(return_data)
    return_id = str(uuid.uuid4())

    request_payload = return_data.model_dump(mode="json")
    assessment_payload = assessment.model_dump(mode="json")
    assessment_payload["return_id"] = return_id

    return_request = ReturnRequest(
        id=return_id,
        order_id=return_data.order_id,
        customer_id=return_data.customer_id,
        product_name=return_data.product_name,
        risk_score=assessment.risk_score,
        risk_level=assessment.risk_level.value,
        recommendation=assessment.recommendation.value,
        status="pending",
        request_payload=request_payload,
        assessment_payload=assessment_payload,
    )

    try:
        db.add(return_request)
        db.commit()
        db.refresh(return_request)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A return request already exists for this order.",
        )

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create the return request.",
        )

    return build_assessment_response(return_request)


@router.get(
    "",
    response_model=list[ReturnAssessment],
)
def list_returns(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "merchant",
            "reviewer",
        )
    ),
) -> list[ReturnAssessment]:
    return_requests = db.scalars(
        select(ReturnRequest).order_by(
            ReturnRequest.created_at.desc()
        )
    ).all()

    return [
        build_assessment_response(return_request)
        for return_request in return_requests
    ]


@router.get(
    "/{return_id}",
    response_model=ReturnAssessment,
)
def get_return(
    return_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "merchant",
            "reviewer",
        )
    ),
) -> ReturnAssessment:
    return_request = db.get(ReturnRequest, return_id)

    if return_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Return request not found.",
        )

    return build_assessment_response(return_request)