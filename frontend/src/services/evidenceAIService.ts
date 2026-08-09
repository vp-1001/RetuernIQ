import api from "./api"

export interface CodeVerification {
  qr_available?: boolean
  barcode_available?: boolean
  detected?: boolean
  decoded?: Array<{
    type: string
    value: string
  }>
}

export interface ImageQualityVerification {
  width?: number
  height?: number
  blur_score?: number
  brightness_score?: number
  quality_score?: number
  issues?: string[]
  acceptable?: boolean
}

export interface DamageVerification {
  damage_detected?: boolean
  damage_confidence?: number
  intact_confidence?: number
  status?: string
  note?: string
}

export interface IdentifierComparisonItem {
  expected?: string[]
  extracted?: string[]
  matched?: boolean
  matched_values?: string[]
  mismatch?: boolean
  status?: string
}

export interface IdentifierComparison {
  overall_status?: string
  has_expected_identifiers?: boolean
  comparisons?: Record<
    string,
    IdentifierComparisonItem
  >
}

export interface EvidenceVerification {
  codes?: CodeVerification
  quality?: ImageQualityVerification
  damage?: DamageVerification
  identifier_comparison?: IdentifierComparison
}

export interface AITimelineItem {
  step: string
  title: string
  status: string
  timestamp?: string | null
}

export interface MultiImageConsistency {
  status: string
  consistent: boolean
  dominant_label?: string | null
  agreement_ratio: number
  labels: string[]
}

export interface EvidenceAIAnalysis {
  id: string
  evidence_id: string
  return_id: string
  model_name: string
  expected_product: string
  expected_category: string
  detected_label: string
  detection_confidence: number
  similarity_score: number
  match_status:
    | "match"
    | "uncertain"
    | "mismatch"
  mismatch_detected: boolean
  duplicate_detected: boolean
  duplicate_evidence_id: string | null
  perceptual_hash: string
  ocr_text: string
  ocr_confidence: number
  extracted_identifiers: {
    order_ids?: string[]
    serial_numbers?: string[]
    imei_numbers?: string[]
    tracking_numbers?: string[]
  }
  risk_adjustment: number
  fraud_signals: string[]
  explanation: string
  raw_predictions: {
    expected_label?: string
    predictions?: Array<{
      label: string
      score: number
    }>
    verification?: EvidenceVerification
  }
  verification?: EvidenceVerification
  analyzed_at: string
}

export interface ReturnEvidenceSummary {
  return_id: string
  expected_product: string
  expected_category: string
  evidence_count: number
  analyzed_count: number
  matched_count: number
  mismatched_count: number
  duplicate_count: number
  average_similarity: number
  total_risk_adjustment: number
  effective_risk_score: number
  verification_status: string
  severe_approval_block: boolean
  multi_image_consistency: MultiImageConsistency
  timeline: AITimelineItem[]
  recommended_action:
    | "continue_review"
    | "human_review"
    | "request_more_evidence"
    | string
  explanation: string
  analyses: EvidenceAIAnalysis[]
}

export interface EvidenceAIHealth {
  clip_available: boolean
  ocr_available: boolean
  qr_available: boolean
  barcode_available: boolean
  model_name: string
  device: string
  message: string
}

export interface AIAnalytics {
  total_analyses: number
  matched: number
  uncertain: number
  mismatched: number
  duplicates: number
  ocr_success_count: number
  ocr_success_rate: number
  identifier_mismatches: number
  barcode_or_qr_detected: number
  damage_flags: number
  average_similarity: number
  average_risk_adjustment: number
}

export const getEvidenceAIHealth =
  async (): Promise<EvidenceAIHealth> => {
    const response =
      await api.get<EvidenceAIHealth>(
        "/ai/evidence/health",
      )

    return response.data
  }

export const getAIAnalytics =
  async (): Promise<AIAnalytics> => {
    const response =
      await api.get<AIAnalytics>(
        "/ai/evidence/analytics",
      )

    return response.data
  }

export const analyzeEvidence = async (
  evidenceId: string,
  force = false,
): Promise<EvidenceAIAnalysis> => {
  const response =
    await api.post<EvidenceAIAnalysis>(
      `/ai/evidence/${evidenceId}/analyze`,
      null,
      {
        params: { force },
      },
    )

  return response.data
}

export const getEvidenceAnalysis = async (
  evidenceId: string,
): Promise<EvidenceAIAnalysis> => {
  const response =
    await api.get<EvidenceAIAnalysis>(
      `/ai/evidence/${evidenceId}`,
    )

  return response.data
}

export const analyzeReturnEvidence = async (
  returnId: string,
  force = false,
): Promise<ReturnEvidenceSummary> => {
  const response =
    await api.post<ReturnEvidenceSummary>(
      `/ai/evidence/return/${returnId}/analyze`,
      null,
      {
        params: { force },
      },
    )

  return response.data
}

export const getReturnEvidenceSummary =
  async (
    returnId: string,
  ): Promise<ReturnEvidenceSummary> => {
    const response =
      await api.get<ReturnEvidenceSummary>(
        `/ai/evidence/return/${returnId}`,
      )

    return response.data
  }
