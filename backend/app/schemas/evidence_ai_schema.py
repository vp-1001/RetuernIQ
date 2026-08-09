from datetime import datetime
from typing import Any

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class EvidenceAIAnalysisResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: str
    evidence_id: str
    return_id: str
    model_name: str
    expected_product: str
    expected_category: str
    detected_label: str
    detection_confidence: float
    similarity_score: float
    match_status: str
    mismatch_detected: bool
    duplicate_detected: bool
    duplicate_evidence_id: str | None
    perceptual_hash: str
    ocr_text: str
    ocr_confidence: float
    extracted_identifiers: dict
    risk_adjustment: int
    fraud_signals: list[str]
    explanation: str
    raw_predictions: dict
    verification: dict = Field(
        default_factory=dict
    )
    analyzed_at: datetime


class ReturnEvidenceSummary(BaseModel):
    return_id: str
    expected_product: str
    expected_category: str
    evidence_count: int
    analyzed_count: int
    matched_count: int
    mismatched_count: int
    duplicate_count: int
    average_similarity: float
    total_risk_adjustment: int
    effective_risk_score: int
    verification_status: str
    severe_approval_block: bool
    multi_image_consistency: dict
    timeline: list[dict[str, Any]]
    recommended_action: str
    explanation: str
    analyses: list[
        EvidenceAIAnalysisResponse
    ]


class AIHealthResponse(BaseModel):
    clip_available: bool
    ocr_available: bool
    qr_available: bool
    barcode_available: bool
    model_name: str
    device: str
    message: str


class AIAnalyticsResponse(BaseModel):
    total_analyses: int
    matched: int
    uncertain: int
    mismatched: int
    duplicates: int
    ocr_success_count: int
    ocr_success_rate: float
    identifier_mismatches: int
    barcode_or_qr_detected: int
    damage_flags: int
    average_similarity: float
    average_risk_adjustment: float
