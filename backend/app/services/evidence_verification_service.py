from __future__ import annotations

from collections import Counter
from pathlib import Path
from typing import Any

from PIL import Image

from backend.app.core.config import settings
from backend.app.models.evidence_model import Evidence
from backend.app.models.return_model import ReturnRequest


def _normalise(value: Any) -> str:
    return str(value or "").strip().upper().replace(" ", "")


def expected_identifiers(
    return_request: ReturnRequest,
) -> dict[str, list[str]]:
    payload = return_request.request_payload or {}

    values = {
        "order_ids": [
            return_request.order_id,
            payload.get("external_return_id"),
            payload.get("amazon_order_id"),
            payload.get("marketplace_order_id"),
        ],
        "serial_numbers": [
            payload.get("serial_number"),
            payload.get("product_serial_number"),
        ],
        "imei_numbers": [
            payload.get("imei"),
            payload.get("imei_number"),
        ],
        "tracking_numbers": [
            payload.get("tracking_id"),
            payload.get("tracking_number"),
            payload.get("awb"),
        ],
        "sku_values": [
            payload.get("sku"),
            payload.get("asin"),
            payload.get("product_id"),
        ],
    }

    return {
        key: [
            str(item).strip()
            for item in items
            if item not in (None, "")
        ]
        for key, items in values.items()
    }


def compare_identifiers(
    extracted: dict[str, list[str]],
    expected: dict[str, list[str]],
) -> dict[str, Any]:
    comparisons: dict[str, Any] = {}
    any_expected = False
    any_match = False
    any_mismatch = False

    for key in (
        "order_ids",
        "serial_numbers",
        "imei_numbers",
        "tracking_numbers",
    ):
        extracted_values = extracted.get(key, [])
        expected_values = expected.get(key, [])

        normalised_extracted = {
            _normalise(value)
            for value in extracted_values
        }
        normalised_expected = {
            _normalise(value)
            for value in expected_values
        }

        has_expected = bool(normalised_expected)
        matched_values = sorted(
            normalised_extracted
            & normalised_expected
        )

        mismatch = (
            has_expected
            and bool(normalised_extracted)
            and not matched_values
        )

        any_expected = any_expected or has_expected
        any_match = any_match or bool(matched_values)
        any_mismatch = any_mismatch or mismatch

        comparisons[key] = {
            "expected": expected_values,
            "extracted": extracted_values,
            "matched": bool(matched_values),
            "matched_values": matched_values,
            "mismatch": mismatch,
            "status": (
                "match"
                if matched_values
                else "mismatch"
                if mismatch
                else "not_available"
            ),
        }

    if any_mismatch:
        overall_status = "mismatch"
    elif any_match:
        overall_status = "match"
    elif any_expected:
        overall_status = "not_detected"
    else:
        overall_status = "not_configured"

    return {
        "overall_status": overall_status,
        "has_expected_identifiers": any_expected,
        "comparisons": comparisons,
    }


def decode_codes(
    image: Image.Image,
) -> dict[str, Any]:
    decoded: list[dict[str, str]] = []
    qr_available = False
    barcode_available = False

    try:
        import cv2
        import numpy as np

        qr_available = True
        image_array = cv2.cvtColor(
            np.array(image.convert("RGB")),
            cv2.COLOR_RGB2BGR,
        )

        detector = cv2.QRCodeDetector()
        value, _, _ = detector.detectAndDecode(
            image_array
        )

        if value:
            decoded.append(
                {
                    "type": "QR_CODE",
                    "value": value.strip(),
                }
            )
    except Exception:
        pass

    try:
        import numpy as np
        from pyzbar.pyzbar import decode

        barcode_available = True

        for item in decode(
            np.array(image.convert("RGB"))
        ):
            value = item.data.decode(
                "utf-8",
                errors="replace",
            ).strip()

            if value:
                decoded.append(
                    {
                        "type": str(item.type),
                        "value": value,
                    }
                )
    except Exception:
        pass

    unique: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()

    for item in decoded:
        key = (item["type"], item["value"])

        if key not in seen:
            seen.add(key)
            unique.append(item)

    return {
        "qr_available": qr_available,
        "barcode_available": barcode_available,
        "decoded": unique,
        "detected": bool(unique),
    }


def image_quality(
    evidence: Evidence,
    image: Image.Image,
) -> dict[str, Any]:
    width, height = image.size

    blur_score = float(
        evidence.blur_score or 0
    )
    brightness_score = float(
        evidence.brightness_score or 0
    )

    issues: list[str] = []

    if width < settings.ai_minimum_image_width:
        issues.append("image_width_too_small")

    if height < settings.ai_minimum_image_height:
        issues.append("image_height_too_small")

    if (
        evidence.blur_score is not None
        and blur_score
        < settings.ai_minimum_blur_score
    ):
        issues.append("image_is_blurry")

    if (
        evidence.brightness_score is not None
        and brightness_score
        < settings.ai_minimum_brightness_score
    ):
        issues.append("image_is_too_dark")

    score = max(
        0,
        100
        - 20 * len(issues),
    )

    return {
        "width": width,
        "height": height,
        "blur_score": blur_score,
        "brightness_score": brightness_score,
        "quality_score": score,
        "issues": issues,
        "acceptable": not issues,
    }


def damage_assessment(
    predictions: list[dict[str, Any]],
) -> dict[str, Any]:
    score_by_label = {
        str(item.get("label", "")): float(
            item.get("score", 0)
        )
        for item in predictions
    }

    damage_labels = {
        "visibly damaged product",
        "cracked product",
        "broken product",
        "scratched product",
        "torn product",
        "water damaged product",
    }

    damage_score = max(
        (
            score_by_label.get(label, 0)
            for label in damage_labels
        ),
        default=0,
    )

    intact_score = score_by_label.get(
        "intact product",
        0,
    )

    detected = (
        damage_score
        >= settings.ai_damage_threshold
        and damage_score > intact_score
    )

    return {
        "damage_detected": detected,
        "damage_confidence": round(
            damage_score,
            4,
        ),
        "intact_confidence": round(
            intact_score,
            4,
        ),
        "status": (
            "visible_damage_detected"
            if detected
            else "no_clear_damage_detected"
        ),
        "note": (
            "This is a visual screening signal and must "
            "not replace warehouse inspection."
        ),
    }


def multi_image_consistency(
    analysis_payloads: list[dict[str, Any]],
) -> dict[str, Any]:
    labels = [
        str(item.get("detected_label", ""))
        for item in analysis_payloads
        if item.get("detected_label")
    ]

    if len(labels) < 2:
        return {
            "status": "insufficient_images",
            "consistent": True,
            "dominant_label": (
                labels[0] if labels else None
            ),
            "agreement_ratio": 1.0,
            "labels": labels,
        }

    counts = Counter(labels)
    dominant_label, dominant_count = (
        counts.most_common(1)[0]
    )
    ratio = dominant_count / len(labels)

    return {
        "status": (
            "consistent"
            if ratio
            >= settings.ai_multi_image_agreement_threshold
            else "inconsistent"
        ),
        "consistent": (
            ratio
            >= settings.ai_multi_image_agreement_threshold
        ),
        "dominant_label": dominant_label,
        "agreement_ratio": round(ratio, 4),
        "labels": labels,
    }


def build_timeline(
    analyses: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    timeline: list[dict[str, Any]] = []

    for index, analysis in enumerate(
        analyses,
        start=1,
    ):
        timestamp = analysis.get("analyzed_at")

        timeline.extend(
            [
                {
                    "step": "evidence_loaded",
                    "title": (
                        f"Evidence {index} loaded"
                    ),
                    "status": "completed",
                    "timestamp": timestamp,
                },
                {
                    "step": "visual_classification",
                    "title": (
                        "Product type classified"
                    ),
                    "status": (
                        analysis.get(
                            "match_status",
                            "completed",
                        )
                    ),
                    "timestamp": timestamp,
                },
                {
                    "step": "ocr",
                    "title": "OCR completed",
                    "status": (
                        "completed"
                        if analysis.get("ocr_text")
                        else "no_text_detected"
                    ),
                    "timestamp": timestamp,
                },
                {
                    "step": "code_verification",
                    "title": (
                        "Barcode and QR scan completed"
                    ),
                    "status": (
                        "detected"
                        if analysis.get(
                            "verification",
                            {},
                        )
                        .get(
                            "codes",
                            {},
                        )
                        .get("detected")
                        else "not_detected"
                    ),
                    "timestamp": timestamp,
                },
                {
                    "step": "fraud_screening",
                    "title": (
                        "Fraud signals evaluated"
                    ),
                    "status": (
                        "flagged"
                        if analysis.get(
                            "fraud_signals"
                        )
                        else "clear"
                    ),
                    "timestamp": timestamp,
                },
            ]
        )

    return timeline
