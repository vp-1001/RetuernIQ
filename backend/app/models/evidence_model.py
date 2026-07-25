from uuid import uuid4

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import relationship

from app.database.base import Base


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    return_id = Column(
        String,
        ForeignKey("return_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    filename = Column(
        String,
        nullable=False,
    )

    original_filename = Column(
        String,
        nullable=False,
    )

    file_path = Column(
        String,
        nullable=False,
    )

    file_size = Column(
        Integer,
        nullable=False,
    )

    content_type = Column(
        String,
        nullable=False,
    )

    image_width = Column(
        Integer,
        nullable=True,
    )

    image_height = Column(
        Integer,
        nullable=True,
    )

    brightness_score = Column(
        Float,
        nullable=True,
    )

    blur_score = Column(
        Float,
        nullable=True,
    )

    dominant_red = Column(
        Integer,
        nullable=True,
    )

    dominant_green = Column(
        Integer,
        nullable=True,
    )

    dominant_blue = Column(
        Integer,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    return_request = relationship(
        "ReturnRequest",
        back_populates="evidence",
    )