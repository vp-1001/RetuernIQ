from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path
from typing import Any

from PIL import Image
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.models.evidence_ai_model import (
    EvidenceAIAnalysis,
)
from backend.app.models.evidence_model import Evidence
from backend.app.models.return_model import ReturnRequest
from backend.app.services.evidence_verification_service import (
    build_timeline,
    compare_identifiers,
    damage_assessment,
    decode_codes,
    expected_identifiers,
    image_quality,
    multi_image_consistency,
)


GENERIC_LABELS = [
    "smartphone",
    "wireless earbuds",
    "headphones",
    "laptop computer",
    "tablet",
    "smartwatch",
    "computer keyboard",
    "computer mouse",
    "charger",
    "camera",
    "television",
    "shoe",
    "shirt",
    "handbag",
    "backpack",
    "pillow",
    "bedsheet",
    "blanket",
    "book",
    "pen",
    "bottle",
    "toy",
    "kitchen appliance",
    "cosmetic product",
    "electronic accessory",
    "cardboard package",
    "invoice document",
    "visibly damaged product",
    "cracked product",
    "broken product",
    "scratched product",
    "torn product",
    "water damaged product",
    "intact product",
]


CATEGORY_LABELS = {
    "electronics": [
        "smartphone",
        "wireless earbuds",
        "headphones",
        "laptop computer",
        "tablet",
        "smartwatch",
        "computer keyboard",
        "computer mouse",
        "charger",
        "camera",
        "television",
        "electronic accessory",
    ],
    "fashion": [
        "shoe",
        "shirt",
        "handbag",
        "backpack",
        "smartwatch",
    ],
    "home": [
        "pillow",
        "bedsheet",
        "blanket",
        "bottle",
        "kitchen appliance",
    ],
    "books": ["book", "pen"],
    "beauty": ["cosmetic product"],
}


PRODUCT_HINTS = {
    "iphone": "smartphone",
    "galaxy": "smartphone",
    "pixel": "smartphone",
    "phone": "smartphone",
    "mobile": "smartphone",
    "airpod": "wireless earbuds",
    "earbud": "wireless earbuds",
    "airdopes": "wireless earbuds",
    "buds": "wireless earbuds",
    "headphone": "headphones",
    "headset": "headphones",
    "macbook": "laptop computer",
    "laptop": "laptop computer",
    "ipad": "tablet",
    "tablet": "tablet",
    "watch": "smartwatch",
    "keyboard": "computer keyboard",
    "mouse": "computer mouse",
    "charger": "charger",
    "camera": "camera",
    "television": "television",
    "shoe": "shoe",
    "sneaker": "shoe",
    "shirt": "shirt",
    "bag": "handbag",
    "backpack": "backpack",
    "pillow": "pillow",
    "bedsheet": "bedsheet",
    "blanket": "blanket",
    "book": "book",
    "pen": "pen",
    "bottle": "bottle",
}


def _device() -> str:
    try:
        import torch

        return (
            "cuda"
            if torch.cuda.is_available()
            else "cpu"
        )
    except ImportError:
        return "unavailable"


@lru_cache(maxsize=1)
def _classifier():
    try:
        from transformers import pipeline

        device = (
            0 if _device() == "cuda" else -1
        )

        return pipeline(
            "zero-shot-image-classification",
            model=settings.ai_clip_model,
            device=device,
        )
    except Exception:
        return None


@lru_cache(maxsize=1)
def _ocr_reader():
    if not settings.ai_ocr_enabled:
        return None

    try:
        import easyocr

        return easyocr.Reader(
            ["en"],
            gpu=_device() == "cuda",
            verbose=False,
        )
    except Exception:
        return None


def runtime_status() -> dict[str, Any]:
    clip = _classifier()
    ocr = _ocr_reader()

    try:
        import cv2  # noqa: F401

        qr_available = True
    except Exception:
        qr_available = False

    try:
        from pyzbar.pyzbar import decode  # noqa: F401

        barcode_available = True
    except Exception:
        barcode_available = False

    return {
        "clip_available": clip is not None,
        "ocr_available": ocr is not None,
        "qr_available": qr_available,
        "barcode_available": barcode_available,
        "model_name": settings.ai_clip_model,
        "device": _device(),
        "message": (
            "AI evidence runtime is ready."
            if clip is not None
            else (
                "Install requirements-phase8.txt and "
                "allow the CLIP model to download once."
            )
        ),
    }


def expected_label(
    product_name: str,
    category: str,
) -> str:
    text = product_name.lower()

    for keyword, label in PRODUCT_HINTS.items():
        if keyword in text:
            return label

    category_labels = CATEGORY_LABELS.get(
        category.lower().strip()
    )

    return (
        category_labels[0]
        if category_labels
        else category.lower().strip()
        or "product"
    )


def candidate_labels(
    product_name: str,
    category: str,
) -> list[str]:
    labels = [
        expected_label(
            product_name,
            category,
        )
    ]

    labels.extend(
        CATEGORY_LABELS.get(
            category.lower().strip(),
            [],
        )
    )
    labels.extend(GENERIC_LABELS)

    return list(dict.fromkeys(labels))


def make_hash(image: Image.Image) -> str:
    try:
        import imagehash

        return str(
            imagehash.phash(
                image.convert("RGB")
            )
        )
    except ImportError:
        gray = image.convert("L").resize(
            (16, 16)
        )
        pixels = list(gray.getdata())
        mean = sum(pixels) / len(pixels)

        bits = "".join(
            "1" if pixel >= mean else "0"
            for pixel in pixels
        )

        return hex(int(bits, 2))[2:].zfill(
            64
        )


def classify(
    image: Image.Image,
    labels: list[str],
) -> list[dict[str, Any]]:
    classifier = _classifier()

    if classifier is None:
        raise RuntimeError(
            "CLIP is unavailable. Install "
            "requirements-phase8.txt and restart "
            "the backend."
        )

    results = classifier(
        image.convert("RGB"),
        candidate_labels=labels,
    )

    return [
        {
            "label": str(item["label"]),
            "score": round(
                float(item["score"]),
                4,
            ),
        }
        for item in results[:15]
    ]


def run_ocr(
    image: Image.Image,
) -> tuple[str, float]:
    reader = _ocr_reader()

    if reader is None:
        return "", 0.0

    import numpy as np

    results = reader.readtext(
        np.array(image.convert("RGB")),
        detail=1,
        paragraph=False,
    )

    texts: list[str] = []
    confidences: list[float] = []

    for _, text, confidence in results:
        value = str(text).strip()

        if value:
            texts.append(value)
            confidences.append(
                float(confidence)
            )

    return (
        "\n".join(texts),
        round(
            sum(confidences)
            / len(confidences),
            4,
        )
        if confidences
        else 0.0,
    )


def extract_identifiers(
    text: str,
) -> dict[str, list[str]]:
    value = text.upper()

    return {
        "order_ids": list(
            dict.fromkeys(
                re.findall(
                    (
                        r"\b(?:ORDER|ORD)"
                        r"[\s:#-]*"
                        r"([A-Z0-9-]{5,30})\b"
                    ),
                    value,
                )
            )
        ),
        "serial_numbers": list(
            dict.fromkeys(
                re.findall(
                    (
                        r"\b(?:SERIAL|S/N|S\/N|SN)"
                        r"[\s:#-]*"
                        r"([A-Z0-9-]{5,30})\b"
                    ),
                    value,
                )
            )
        ),
        "imei_numbers": list(
            dict.fromkeys(
                re.findall(
                    r"\b\d{15}\b",
                    value,
                )
            )
        ),
        "tracking_numbers": list(
            dict.fromkeys(
                re.findall(
                    (
                        r"\b(?:TRACKING|AWB)"
                        r"[\s:#-]*"
                        r"([A-Z0-9-]{6,35})\b"
                    ),
                    value,
                )
            )
        ),
    }


def _serialise_analysis(
    analysis: EvidenceAIAnalysis,
) -> dict[str, Any]:
    raw = analysis.raw_predictions or {}

    return {
        "id": analysis.id,
        "evidence_id": analysis.evidence_id,
        "return_id": analysis.return_id,
        "model_name": analysis.model_name,
        "expected_product": (
            analysis.expected_product
        ),
        "expected_category": (
            analysis.expected_category
        ),
        "detected_label": (
            analysis.detected_label
        ),
        "detection_confidence": (
            analysis.detection_confidence
        ),
        "similarity_score": (
            analysis.similarity_score
        ),
        "match_status": analysis.match_status,
        "mismatch_detected": (
            analysis.mismatch_detected
        ),
        "duplicate_detected": (
            analysis.duplicate_detected
        ),
        "duplicate_evidence_id": (
            analysis.duplicate_evidence_id
        ),
        "perceptual_hash": (
            analysis.perceptual_hash
        ),
        "ocr_text": analysis.ocr_text,
        "ocr_confidence": (
            analysis.ocr_confidence
        ),
        "extracted_identifiers": (
            analysis.extracted_identifiers
            or {}
        ),
        "risk_adjustment": (
            analysis.risk_adjustment
        ),
        "fraud_signals": (
            analysis.fraud_signals or []
        ),
        "explanation": analysis.explanation,
        "raw_predictions": raw,
        "verification": raw.get(
            "verification",
            {},
        ),
        "analyzed_at": (
            analysis.analyzed_at
        ),
    }


def _risk_level(score: int) -> str:
    if score >= 80:
        return "critical"

    if score >= 60:
        return "high"

    if score >= 30:
        return "medium"

    return "low"


def _apply_return_summary(
    db: Session,
    return_request: ReturnRequest,
    analyses: list[EvidenceAIAnalysis],
) -> None:
    assessment = dict(
        return_request.assessment_payload
        or {}
    )

    base_score = int(
        assessment.get(
            "pre_evidence_risk_score",
            return_request.risk_score,
        )
    )

    assessment[
        "pre_evidence_risk_score"
    ] = base_score

    payloads = [
        _serialise_analysis(item)
        for item in analyses
    ]

    mismatch_count = sum(
        item.mismatch_detected
        for item in analyses
    )
    duplicate_count = sum(
        item.duplicate_detected
        for item in analyses
    )

    identifier_mismatches = sum(
        (
            item.raw_predictions
            or {}
        )
        .get("verification", {})
        .get("identifier_comparison", {})
        .get("overall_status")
        == "mismatch"
        for item in analyses
    )

    visible_damage_count = sum(
        (
            item.raw_predictions
            or {}
        )
        .get("verification", {})
        .get("damage", {})
        .get("damage_detected", False)
        for item in analyses
    )

    consistency = multi_image_consistency(
        payloads
    )

    risk_adjustment = min(
        settings.ai_maximum_risk_adjustment,
        sum(
            item.risk_adjustment
            for item in analyses
        )
        + (
            settings.ai_inconsistent_images_risk
            if not consistency["consistent"]
            else 0
        ),
    )

    severe_block = bool(
        mismatch_count
        or duplicate_count
        or identifier_mismatches
        or not consistency["consistent"]
    )

    effective_score = min(
        100,
        base_score + risk_adjustment,
    )

    return_request.risk_score = (
        effective_score
    )
    return_request.risk_level = (
        _risk_level(effective_score)
    )

    if severe_block:
        return_request.recommendation = (
            "manual_inspection"
        )

    assessment["human_review_required"] = (
        severe_block
        or bool(
            assessment.get(
                "human_review_required",
                False,
            )
        )
    )

    assessment["evidence_ai"] = {
        "analyzed_count": len(analyses),
        "mismatch_count": mismatch_count,
        "duplicate_count": duplicate_count,
        "identifier_mismatch_count": (
            identifier_mismatches
        ),
        "visible_damage_count": (
            visible_damage_count
        ),
        "average_similarity": round(
            sum(
                item.similarity_score
                for item in analyses
            )
            / len(analyses),
            4,
        ),
        "risk_adjustment": risk_adjustment,
        "effective_risk_score": (
            effective_score
        ),
        "fraud_signals": sorted(
            {
                signal
                for item in analyses
                for signal in (
                    item.fraud_signals or []
                )
            }
        ),
        "multi_image_consistency": (
            consistency
        ),
        "severe_approval_block": (
            severe_block
        ),
        "verification_status": (
            "blocked"
            if severe_block
            else "clear"
        ),
        "timeline": build_timeline(
            payloads
        ),
    }

    return_request.assessment_payload = (
        assessment
    )

    db.add(return_request)
    db.commit()


def analyze_evidence(
    db: Session,
    evidence: Evidence,
    return_request: ReturnRequest,
    force: bool = False,
) -> EvidenceAIAnalysis:
    existing = db.scalar(
        select(EvidenceAIAnalysis).where(
            EvidenceAIAnalysis.evidence_id
            == evidence.id
        )
    )

    if existing is not None and not force:
        return existing

    image_path = Path(evidence.file_path)

    if not image_path.exists():
        raise FileNotFoundError(
            "Evidence image file not found."
        )

    payload = (
        return_request.request_payload
        or {}
    )
    category = str(
        payload.get(
            "product_category",
            "other",
        )
    )
    expected = expected_label(
        return_request.product_name,
        category,
    )

    with Image.open(image_path) as image:
        rgb = image.convert("RGB")

        image_hash = make_hash(rgb)
        predictions = classify(
            rgb,
            candidate_labels(
                return_request.product_name,
                category,
            ),
        )
        ocr_text, ocr_confidence = (
            run_ocr(rgb)
        )

        extracted = extract_identifiers(
            ocr_text
        )
        codes = decode_codes(rgb)
        quality = image_quality(
            evidence,
            rgb,
        )
        damage = damage_assessment(
            predictions
        )

    top = predictions[0]

    expected_prediction = next(
        (
            item
            for item in predictions
            if item["label"] == expected
        ),
        {"score": 0.0},
    )
    similarity = float(
        expected_prediction["score"]
    )

    if (
        top["label"] == expected
        and similarity
        >= settings.ai_match_threshold
    ):
        match_status = "match"
    elif (
        similarity
        >= settings.ai_review_threshold
    ):
        match_status = "uncertain"
    else:
        match_status = "mismatch"

    duplicate = db.scalar(
        select(EvidenceAIAnalysis)
        .where(
            EvidenceAIAnalysis.perceptual_hash
            == image_hash,
            EvidenceAIAnalysis.evidence_id
            != evidence.id,
        )
        .order_by(
            EvidenceAIAnalysis.analyzed_at.desc()
        )
    )

    expected_ids = expected_identifiers(
        return_request
    )
    identifier_comparison = (
        compare_identifiers(
            extracted,
            expected_ids,
        )
    )

    signals: list[str] = []
    adjustment = 0

    if match_status == "mismatch":
        signals.append(
            "uploaded_product_mismatch"
        )
        adjustment += 35
    elif match_status == "uncertain":
        signals.append(
            "visual_match_inconclusive"
        )
        adjustment += 10

    if duplicate is not None:
        signals.append(
            "duplicate_evidence_image"
        )
        adjustment += 30

    if not quality["acceptable"]:
        signals.extend(quality["issues"])
        adjustment += min(
            10,
            len(quality["issues"]) * 3,
        )

    if (
        identifier_comparison[
            "overall_status"
        ]
        == "mismatch"
    ):
        signals.append(
            "identifier_mismatch"
        )
        adjustment += 30

    if damage["damage_detected"]:
        signals.append(
            "visible_damage_detected"
        )
        adjustment += 8

    if codes["detected"]:
        signals.append(
            "barcode_or_qr_detected"
        )

    explanation = (
        f"Expected product type: {expected}. "
        f"Detected: {top['label']} with "
        f"{float(top['score']) * 100:.1f}% "
        "confidence. "
        "Expected-product similarity: "
        f"{similarity * 100:.1f}%. "
    )

    if match_status == "match":
        explanation += (
            "The evidence is visually "
            "consistent with the claimed "
            "product. "
        )
    elif match_status == "uncertain":
        explanation += (
            "The evidence is inconclusive "
            "and requires human review. "
        )
    else:
        explanation += (
            "The evidence appears "
            "inconsistent with the claimed "
            "product. "
        )

    if duplicate is not None:
        explanation += (
            "A duplicate or near-identical "
            "evidence image was detected. "
        )

    if (
        identifier_comparison[
            "overall_status"
        ]
        == "mismatch"
    ):
        explanation += (
            "OCR identifiers do not match "
            "the return record. "
        )

    if damage["damage_detected"]:
        explanation += (
            "Possible visible damage was "
            "detected and should be confirmed "
            "during warehouse inspection."
        )

    verification = {
        "codes": codes,
        "quality": quality,
        "damage": damage,
        "identifier_comparison": (
            identifier_comparison
        ),
    }

    values = {
        "return_id": return_request.id,
        "model_name": (
            settings.ai_clip_model
        ),
        "expected_product": (
            return_request.product_name
        ),
        "expected_category": category,
        "detected_label": top["label"],
        "detection_confidence": float(
            top["score"]
        ),
        "similarity_score": similarity,
        "match_status": match_status,
        "mismatch_detected": (
            match_status == "mismatch"
        ),
        "duplicate_detected": (
            duplicate is not None
        ),
        "duplicate_evidence_id": (
            duplicate.evidence_id
            if duplicate
            else None
        ),
        "perceptual_hash": image_hash,
        "ocr_text": ocr_text,
        "ocr_confidence": (
            ocr_confidence
        ),
        "extracted_identifiers": (
            extracted
        ),
        "risk_adjustment": min(
            settings.ai_maximum_single_image_risk,
            adjustment,
        ),
        "fraud_signals": list(
            dict.fromkeys(signals)
        ),
        "explanation": explanation,
        "raw_predictions": {
            "expected_label": expected,
            "predictions": predictions,
            "verification": verification,
        },
    }

    if existing is None:
        analysis = EvidenceAIAnalysis(
            evidence_id=evidence.id,
            **values,
        )
    else:
        analysis = existing

        for key, value in values.items():
            setattr(
                analysis,
                key,
                value,
            )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    analyses = db.scalars(
        select(EvidenceAIAnalysis).where(
            EvidenceAIAnalysis.return_id
            == return_request.id
        )
    ).all()

    _apply_return_summary(
        db,
        return_request,
        analyses,
    )

    return analysis


def return_summary(
    db: Session,
    return_request: ReturnRequest,
) -> dict[str, Any]:
    evidence_items = db.scalars(
        select(Evidence).where(
            Evidence.return_id
            == return_request.id
        )
    ).all()

    analyses = db.scalars(
        select(EvidenceAIAnalysis)
        .where(
            EvidenceAIAnalysis.return_id
            == return_request.id
        )
        .order_by(
            EvidenceAIAnalysis.analyzed_at.desc()
        )
    ).all()

    payloads = [
        _serialise_analysis(item)
        for item in analyses
    ]

    matched = sum(
        item.match_status == "match"
        for item in analyses
    )
    mismatched = sum(
        item.match_status == "mismatch"
        for item in analyses
    )
    duplicates = sum(
        item.duplicate_detected
        for item in analyses
    )

    average = (
        sum(
            item.similarity_score
            for item in analyses
        )
        / len(analyses)
        if analyses
        else 0.0
    )

    consistency = (
        multi_image_consistency(payloads)
    )

    assessment = (
        return_request.assessment_payload
        or {}
    )
    evidence_summary = assessment.get(
        "evidence_ai",
        {},
    )

    severe_block = bool(
        evidence_summary.get(
            "severe_approval_block",
            False,
        )
    )

    if severe_block:
        action = "human_review"
        explanation = (
            "Severe evidence-verification "
            "signals require reviewer action."
        )
    elif (
        analyses
        and matched == len(analyses)
    ):
        action = "continue_review"
        explanation = (
            "All analyzed images match the "
            "claimed product type."
        )
    else:
        action = "request_more_evidence"
        explanation = (
            "Evidence is incomplete or "
            "inconclusive."
        )

    payload = (
        return_request.request_payload
        or {}
    )

    return {
        "return_id": return_request.id,
        "expected_product": (
            return_request.product_name
        ),
        "expected_category": str(
            payload.get(
                "product_category",
                "other",
            )
        ),
        "evidence_count": (
            len(evidence_items)
        ),
        "analyzed_count": len(analyses),
        "matched_count": matched,
        "mismatched_count": mismatched,
        "duplicate_count": duplicates,
        "average_similarity": round(
            average,
            4,
        ),
        "total_risk_adjustment": int(
            evidence_summary.get(
                "risk_adjustment",
                0,
            )
        ),
        "effective_risk_score": (
            return_request.risk_score
        ),
        "verification_status": (
            evidence_summary.get(
                "verification_status",
                "not_analyzed",
            )
        ),
        "severe_approval_block": (
            severe_block
        ),
        "multi_image_consistency": (
            consistency
        ),
        "timeline": evidence_summary.get(
            "timeline",
            [],
        ),
        "recommended_action": action,
        "explanation": explanation,
        "analyses": payloads,
    }


def ai_analytics(
    db: Session,
) -> dict[str, Any]:
    analyses = db.scalars(
        select(EvidenceAIAnalysis)
    ).all()

    total = len(analyses)

    mismatches = sum(
        item.mismatch_detected
        for item in analyses
    )
    duplicates = sum(
        item.duplicate_detected
        for item in analyses
    )
    ocr_success = sum(
        bool(item.ocr_text)
        for item in analyses
    )

    identifier_mismatches = sum(
        (
            item.raw_predictions
            or {}
        )
        .get("verification", {})
        .get("identifier_comparison", {})
        .get("overall_status")
        == "mismatch"
        for item in analyses
    )

    barcode_or_qr = sum(
        (
            item.raw_predictions
            or {}
        )
        .get("verification", {})
        .get("codes", {})
        .get("detected", False)
        for item in analyses
    )

    damage_flags = sum(
        (
            item.raw_predictions
            or {}
        )
        .get("verification", {})
        .get("damage", {})
        .get("damage_detected", False)
        for item in analyses
    )

    return {
        "total_analyses": total,
        "matched": sum(
            item.match_status == "match"
            for item in analyses
        ),
        "uncertain": sum(
            item.match_status
            == "uncertain"
            for item in analyses
        ),
        "mismatched": mismatches,
        "duplicates": duplicates,
        "ocr_success_count": ocr_success,
        "ocr_success_rate": round(
            (
                ocr_success / total * 100
                if total
                else 0
            ),
            2,
        ),
        "identifier_mismatches": (
            identifier_mismatches
        ),
        "barcode_or_qr_detected": (
            barcode_or_qr
        ),
        "damage_flags": damage_flags,
        "average_similarity": round(
            (
                sum(
                    item.similarity_score
                    for item in analyses
                )
                / total
                if total
                else 0
            ),
            4,
        ),
        "average_risk_adjustment": round(
            (
                sum(
                    item.risk_adjustment
                    for item in analyses
                )
                / total
                if total
                else 0
            ),
            2,
        ),
    }
