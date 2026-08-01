import api from "./api"

export type ReviewStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "evidence_requested"
  | "escalated"

export type ReviewAction =
  | "approve"
  | "reject"
  | "request_evidence"
  | "escalate"

export interface ReviewerSummary {
  id: string
  full_name: string
  email: string
  role: string
}

export interface ReviewDecision {
  id: string
  return_id: string
  reviewer_id: string
  action: ReviewAction
  previous_status: ReviewStatus
  new_status: ReviewStatus
  ai_recommendation: string
  final_decision: string
  remarks: string | null
  created_at: string
  reviewer: ReviewerSummary
}

export interface ReviewQueueItem {
  return_id: string
  order_id: string
  customer_id: string
  product_name: string
  risk_score: number
  risk_level: string
  recommendation: string
  status: ReviewStatus
  human_review_required: boolean
  recommendation_reason: string
  created_at: string
  updated_at: string
  latest_decision: ReviewDecision | null
}

export interface ReviewDetail {
  return_id: string
  order_id: string
  customer_id: string
  product_name: string
  risk_score: number
  risk_level: string
  recommendation: string
  status: ReviewStatus
  request_payload: Record<string, unknown>
  assessment_payload: Record<string, unknown>
  created_at: string
  updated_at: string
  audit_trail: ReviewDecision[]
}

export interface ReviewQueueSummary {
  total: number
  pending: number
  approved: number
  rejected: number
  evidence_requested: number
  escalated: number
}

export interface ReviewFilters {
  status?: ReviewStatus | "all"
  riskLevel?: string
  search?: string
  skip?: number
  limit?: number
}

export interface SubmitReviewDecisionPayload {
  action: ReviewAction
  remarks?: string
}

export const getReviewQueue = async (
  filters: ReviewFilters = {},
): Promise<ReviewQueueItem[]> => {
  const params: Record<string, string | number> = {}

  if (filters.status && filters.status !== "all") {
    params.status = filters.status
  }

  if (filters.riskLevel) {
    params.risk_level = filters.riskLevel
  }

  if (filters.search?.trim()) {
    params.search = filters.search.trim()
  }

  params.skip = filters.skip ?? 0
  params.limit = filters.limit ?? 50

  const response = await api.get<ReviewQueueItem[]>(
    "/reviews",
    {
      params,
    },
  )

  return response.data
}

export const getReviewDetail = async (
  returnId: string,
): Promise<ReviewDetail> => {
  const response = await api.get<ReviewDetail>(
    `/reviews/${returnId}`,
  )

  return response.data
}

export const getReviewSummary =
  async (): Promise<ReviewQueueSummary> => {
    const response =
      await api.get<ReviewQueueSummary>(
        "/reviews/summary",
      )

    return response.data
  }

export const submitReviewDecision = async (
  returnId: string,
  payload: SubmitReviewDecisionPayload,
): Promise<ReviewDecision> => {
  const response = await api.post<ReviewDecision>(
    `/reviews/${returnId}/decision`,
    payload,
  )

  return response.data
}