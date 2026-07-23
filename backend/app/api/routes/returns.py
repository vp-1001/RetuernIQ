from fastapi import APIRouter, HTTPException, status

from app.schemas.return_schema import ReturnAssessment, ReturnCreate
from app.services.risk_engine import assess_return


router = APIRouter(prefix="/returns", tags=["Returns"])

return_store: dict[str, ReturnAssessment] = {}


@router.post(
    "",
    response_model=ReturnAssessment,
    status_code=status.HTTP_201_CREATED
)
def create_return(payload: ReturnCreate) -> ReturnAssessment:
    assessment = assess_return(payload)
    return_store[assessment.return_id] = assessment
    return assessment


@router.get("", response_model=list[ReturnAssessment])
def list_returns() -> list[ReturnAssessment]:
    return list(return_store.values())


@router.get("/{return_id}", response_model=ReturnAssessment)
def get_return(return_id: str) -> ReturnAssessment:
    assessment = return_store.get(return_id)

    if assessment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Return assessment not found."
        )

    return assessment