from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from PIL import Image, UnidentifiedImageError
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from backend.app.api.dependencies import require_roles
from backend.app.core.storage import EVIDENCE_DIR
from backend.app.database.session import get_db
from backend.app.models.evidence_model import Evidence
from backend.app.models.return_model import ReturnRequest
from backend.app.models.user_model import User
from backend.app.services.image_analysis_service import analyze_image


router = APIRouter(
    prefix="/evidence",
    tags=["Evidence"],
)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_FILE_SIZE = 10 * 1024 * 1024


def verify_image(
    file_contents: bytes,
    expected_content_type: str,
) -> tuple[int, int, str]:
    try:
        with Image.open(BytesIO(file_contents)) as image:
            image.verify()

        with Image.open(BytesIO(file_contents)) as image:
            width, height = image.size
            image_format = image.format

    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is not a valid image.",
        )

    expected_formats = {
        "image/jpeg": {"JPEG"},
        "image/png": {"PNG"},
        "image/webp": {"WEBP"},
    }

    if image_format not in expected_formats[expected_content_type]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The file content does not match its declared image type.",
        )

    if width <= 0 or height <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The image dimensions are invalid.",
        )

    return width, height, image_format


def serialize_evidence(
    evidence: Evidence,
    request: Request,
) -> dict:
    base_url = str(request.base_url).rstrip("/")

    return {
        "id": evidence.id,
        "return_id": evidence.return_id,
        "original_filename": evidence.original_filename,
        "stored_filename": evidence.filename,
        "content_type": evidence.content_type,
        "file_size": evidence.file_size,
        "image_url": (
            f"{base_url}/uploads/evidence/{evidence.filename}"
        ),
        "image_width": evidence.image_width,
        "image_height": evidence.image_height,
        "brightness_score": evidence.brightness_score,
        "blur_score": evidence.blur_score,
        "dominant_color": {
            "red": evidence.dominant_red,
            "green": evidence.dominant_green,
            "blue": evidence.dominant_blue,
        },
        "created_at": evidence.created_at,
    }


@router.post(
    "/{return_id}",
    status_code=status.HTTP_201_CREATED,
)
async def upload_evidence(
    return_id: str,
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "merchant",
        )
    ),
) -> dict:
    return_request = db.get(ReturnRequest, return_id)

    if return_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Return request not found.",
        )

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file must have a filename.",
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, and WebP images are supported.",
        )

    file_contents = await file.read()

    if not file_contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    if len(file_contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="The uploaded image exceeds the 10 MB limit.",
        )

    _, _, image_format = verify_image(
        file_contents=file_contents,
        expected_content_type=file.content_type,
    )

    analysis = analyze_image(file_contents)

    extension = ALLOWED_CONTENT_TYPES[file.content_type]
    stored_filename = f"{uuid4()}{extension}"
    destination = EVIDENCE_DIR / stored_filename

    try:
        destination.write_bytes(file_contents)

        evidence = Evidence(
            return_id=return_id,
            filename=stored_filename,
            original_filename=Path(file.filename).name,
            file_path=str(destination),
            file_size=len(file_contents),
            content_type=file.content_type,
            image_width=analysis["image_width"],
            image_height=analysis["image_height"],
            brightness_score=analysis["brightness_score"],
            blur_score=analysis["blur_score"],
            dominant_red=analysis["dominant_red"],
            dominant_green=analysis["dominant_green"],
            dominant_blue=analysis["dominant_blue"],
        )

        db.add(evidence)
        db.commit()
        db.refresh(evidence)

    except SQLAlchemyError:
        db.rollback()

        if destination.exists():
            destination.unlink()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save evidence metadata.",
        )

    except OSError:
        db.rollback()

        if destination.exists():
            destination.unlink()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to store the uploaded image.",
        )

    return {
        "message": "Evidence uploaded and analyzed successfully.",
        "image_format": image_format,
        "evidence": serialize_evidence(evidence, request),
    }


@router.get("/return/{return_id}")
def list_evidence_for_return(
    return_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "merchant",
            "reviewer",
        )
    ),
) -> list[dict]:
    return_request = db.get(ReturnRequest, return_id)

    if return_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Return request not found.",
        )

    evidence_items = db.scalars(
        select(Evidence)
        .where(Evidence.return_id == return_id)
        .order_by(Evidence.created_at.desc())
    ).all()

    return [
        serialize_evidence(evidence, request)
        for evidence in evidence_items
    ]


@router.delete("/{evidence_id}")
def delete_evidence(
    evidence_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "merchant",
        )
    ),
) -> dict:
    evidence = db.get(Evidence, evidence_id)

    if evidence is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence not found.",
        )

    image_path = Path(evidence.file_path)

    try:
        db.delete(evidence)
        db.commit()

        if image_path.exists():
            image_path.unlink()

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete evidence.",
        )

    except OSError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Evidence metadata was deleted, but the image file could not be removed.",
        )

    return {
        "message": "Evidence deleted successfully.",
    }