from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.inspection import inspect
from sqlalchemy.orm import Session

from app.api.dependencies import require_merchant, require_roles
from app.database.session import get_db
from app.models.return_model import ReturnRequest
from app.models.user_model import User
from app.schemas.return_schema import ReturnCreate
from app.services.risk_engine import assess_return


router = APIRouter(
    prefix="/returns",
    tags=["Returns"],
)


def convert_to_dictionary(value: Any) -> dict[str, Any]:
    if isinstance(value, BaseModel):
        return value.model_dump()

    if isinstance(value, dict):
        return value

    raise TypeError(
        "Risk assessment must return a dictionary or Pydantic model."
    )


def serialize_return(
    return_request: ReturnRequest,
) -> dict[str, Any]:
    mapper = inspect(return_request).mapper

    return {
        column.key: getattr(return_request, column.key)
        for column in mapper.column_attrs
    }


def get_model_column_names() -> set[str]:
    return {
        column.key
        for column in inspect(ReturnRequest).mapper.column_attrs
    }


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def create_return(
    payload: ReturnCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_merchant),
) -> dict[str, Any]:
    payload_data = payload.model_dump()

    existing_return = db.scalar(
        select(ReturnRequest).where(
            ReturnRequest.order_id == payload_data["order_id"]
        )
    )

    if existing_return is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A return request already exists for this order.",
        )

    try:
        assessment_result = assess_return(payload)
    except TypeError:
        assessment_result = assess_return(payload_data)

    assessment_data = convert_to_dictionary(
        assessment_result
    )

    model_columns = get_model_column_names()

    database_data = {
        key: value
        for key, value in payload_data.items()
        if key in model_columns
    }

    for key, value in assessment_data.items():
        if key in model_columns:
            database_data[key] = value

    if "merchant_id" in model_columns:
        database_data["merchant_id"] = current_user.id

    if "created_by" in model_columns:
        database_data["created_by"] = current_user.id

    if "user_id" in model_columns:
        database_data["user_id"] = current_user.id

    return_request = ReturnRequest(**database_data)

    db.add(return_request)

    try:
        db.commit()
        db.refresh(return_request)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to create the return request.",
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected database error occurred.",
        )

    response = serialize_return(return_request)
    response["assessment"] = assessment_data

    return response


@router.get("")
def list_returns(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "merchant",
            "reviewer",
        )
    ),
) -> list[dict[str, Any]]:
    query = select(ReturnRequest).order_by(
        ReturnRequest.created_at.desc()
    )

    model_columns = get_model_column_names()

    if current_user.role == "merchant":
        if "merchant_id" in model_columns:
            query = query.where(
                ReturnRequest.merchant_id == current_user.id
            )

        elif "user_id" in model_columns:
            query = query.where(
                ReturnRequest.user_id == current_user.id
            )

        elif "created_by" in model_columns:
            query = query.where(
                ReturnRequest.created_by == current_user.id
            )

    return_requests = db.scalars(query).all()

    return [
        serialize_return(return_request)
        for return_request in return_requests
    ]


@router.get("/{return_id}")
def get_return_by_id(
    return_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "merchant",
            "reviewer",
        )
    ),
) -> dict[str, Any]:
    return_request = db.get(
        ReturnRequest,
        return_id,
    )

    if return_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Return request not found.",
        )

    model_columns = get_model_column_names()

    if current_user.role == "merchant":
        owner_id = None

        if "merchant_id" in model_columns:
            owner_id = return_request.merchant_id

        elif "user_id" in model_columns:
            owner_id = return_request.user_id

        elif "created_by" in model_columns:
            owner_id = return_request.created_by

        if (
            owner_id is not None
            and owner_id != current_user.id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this return request.",
            )

    return serialize_return(return_request)