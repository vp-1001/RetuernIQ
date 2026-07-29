from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from backend.app.core.config import settings


def create_access_token(
    subject: str,
    additional_claims: dict[str, Any] | None = None,
) -> str:
    expire_time = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )

    payload: dict[str, Any] = {
        "sub": subject,
        "exp": expire_time,
        "iat": datetime.now(timezone.utc),
    }

    if additional_claims:
        payload.update(additional_claims)

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(
    token: str,
) -> dict[str, Any] | None:
    try:
        return jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError:
        return None