import api from "./api"

export interface CountBucket {
  label: string
  count: number
}

export interface TrendPoint {
  date: string
  total_returns: number
  approved: number
  rejected: number
  pending: number
  escalated: number
  evidence_requested: number
  estimated_loss: number
  estimated_savings: number
}

export interface ProductInsight {
  product_name: string
  total_returns: number
  high_risk_returns: number
  approved: number
  rejected: number
  refund_exposure: number
}

export interface CategoryInsight {
  category: string
  total_returns: number
  high_risk_returns: number
  refund_exposure: number
  estimated_savings: number
}

export interface ReviewerPerformance {
  reviewer_id: string
  reviewer_name: string
  reviewer_email: string
  total_decisions: number
  unique_returns_reviewed: number
  approved: number
  rejected: number
  escalated: number
  evidence_requested: number
  approval_rate: number
  rejection_rate: number
}

export interface AnalyticsOverview {
  total_returns: number
  pending: number
  approved: number
  rejected: number
  escalated: number
  evidence_requested: number
  high_risk_cases: number
  critical_risk_cases: number
  human_review_cases: number
  refund_exposure: number
  estimated_loss: number
  estimated_savings: number
  estimated_fraud_prevented: number
  approval_rate: number
  rejection_rate: number
  resolution_rate: number
  average_risk_score: number
  average_refund_amount: number
  generated_at: string
}

export interface AnalyticsDashboard {
  overview: AnalyticsOverview
  status_distribution: CountBucket[]
  risk_distribution: CountBucket[]
  recommendation_distribution: CountBucket[]
  return_trend: TrendPoint[]
  top_products: ProductInsight[]
  category_insights: CategoryInsight[]
  reviewer_performance: ReviewerPerformance[]
}

export interface AnalyticsFilters {
  startDate?: string
  endDate?: string
}

export const getAnalyticsDashboard = async (
  filters: AnalyticsFilters = {},
): Promise<AnalyticsDashboard> => {
  const response = await api.get<AnalyticsDashboard>(
    "/analytics/dashboard",
    {
      params: {
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
      },
    },
  )

  return response.data
}

export const downloadReport = async (
  path: string,
  filename: string,
  params?: Record<string, string | undefined>,
) => {
  const response = await api.get(path, {
    params,
    responseType: "blob",
  })

  const url = URL.createObjectURL(response.data)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
