def assess_evidence_quality(
    image_width: int,
    image_height: int,
    brightness_score: float,
    blur_score: float,
) -> dict:
    issues: list[str] = []
    quality_score = 100

    if image_width < 640 or image_height < 480:
        quality_score -= 20
        issues.append("Image resolution is too low.")

    if brightness_score < 45:
        quality_score -= 25
        issues.append("Image is too dark.")

    elif brightness_score > 220:
        quality_score -= 20
        issues.append("Image is overexposed.")

    if blur_score < 100:
        quality_score -= 30
        issues.append("Image may be blurry.")

    quality_score = max(0, quality_score)

    if quality_score >= 80:
        quality_label = "good"
    elif quality_score >= 50:
        quality_label = "acceptable"
    else:
        quality_label = "poor"

    return {
        "quality_score": quality_score,
        "quality_label": quality_label,
        "issues": issues,
        "is_usable": quality_score >= 50,
    }