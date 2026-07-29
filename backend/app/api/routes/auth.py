from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.api.dependencies import get_current_user
from backend.app.database.session import get_db
from backend.app.models.user_model import User
from backend.app.schemas.auth_schema import TokenResponse
from backend.app.schemas.user_schema import UserCreate, UserResponse
from backend.app.services.auth_service import hash_password, verify_password
from backend.app.services.jwt_service import create_access_token


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
) -> User:
    normalized_email = payload.email.lower().strip()

    existing_user = db.scalar(
        select(User).where(User.email == normalized_email)
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account already exists with this email.",
        )

    user = User(
        full_name=payload.full_name.strip(),
        email=normalized_email,
        password_hash=hash_password(payload.password),
        role=payload.role.value,
    )

    db.add(user)

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account already exists with this email.",
        )

    return user


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> TokenResponse:
    normalized_email = form_data.username.lower().strip()

    user = db.scalar(
        select(User).where(User.email == normalized_email)
    )

    if user is None or not verify_password(
        form_data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive.",
        )

    access_token = create_access_token(
        subject=user.id,
        additional_claims={
            "email": user.email,
            "role": user.role,
        },
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_authenticated_user(
    current_user: User = Depends(get_current_user),
) -> User:
    return current_user