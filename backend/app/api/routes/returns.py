from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.return_model import ReturnRequest
from app.schemas.return_schema import ReturnAssessment, ReturnCreate
from app.services.risk_engine import assess_return


router = APIRouter(prefix="/returns", tags=["Returns"])


@router.post(
    "",
    response_model=ReturnAssessment,
    status_code=status.HTTP_201_CREATED,
)
def create_return(
    payload: ReturnCreate,
    db: Session = Depends(get_db),
) -> ReturnAssessment:
    assessment = assess_return(payload)

    database_return = ReturnRequest(
        id=assessment.return_id,
        order_id=payload.order_id,
        customer_id=payload.customer_id,
        product_name=payload.product_name,
        risk_score=assessment.risk_score,
        risk_level=assessment.risk_level.value,
        recommendation=assessment.recommendation.value,
        status="pending",
        request_payload=payload.model_dump(mode="json"),
        assessment_payload=assessment.model_dump(mode="json"),
    )

    db.add(database_return)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A return request already exists for this order.",
        )

    return assessment


@router.get("", response_model=list[ReturnAssessment])
def list_returns(
    db: Session = Depends(get_db),
) -> list[ReturnAssessment]:
    statement = select(ReturnRequest).order_by(
        ReturnRequest.created_at.desc()
    )

    records = db.scalars(statement).all()

    return [
        ReturnAssessment.model_validate(record.assessment_payload)
        for record in records
    ]


@router.get("/{return_id}", response_model=ReturnAssessment)
def get_return(
    return_id: str,
    db: Session = Depends(get_db),
) -> ReturnAssessment:
    record = db.get(ReturnRequest, return_id)

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Return assessment not found.",
        )

    return ReturnAssessment.model_validate(record.assessment_payload)