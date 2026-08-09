import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database.base import Base


class EvidenceAIAnalysis(Base):
    __tablename__ = "evidence_ai_analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evidence_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("evidence.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    return_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("return_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    model_name: Mapped[str] = mapped_column(String(255), nullable=False)
    expected_product: Mapped[str] = mapped_column(String(255), nullable=False)
    expected_category: Mapped[str] = mapped_column(String(100), nullable=False)
    detected_label: Mapped[str] = mapped_column(String(255), nullable=False)
    detection_confidence: Mapped[float] = mapped_column(Float, nullable=False)
    similarity_score: Mapped[float] = mapped_column(Float, nullable=False)
    match_status: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    mismatch_detected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    duplicate_detected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    duplicate_evidence_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    perceptual_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    ocr_text: Mapped[str] = mapped_column(Text, default="", nullable=False)
    ocr_confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    extracted_identifiers: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    risk_adjustment: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    fraud_signals: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    raw_predictions: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    analyzed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    evidence = relationship("Evidence", back_populates="ai_analysis")
