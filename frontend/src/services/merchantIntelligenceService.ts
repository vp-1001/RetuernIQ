import api from "./api"

export interface KPIOverview {
  total_returns: number
  active_reviews: number
  resolved_returns: number
  approved_returns: number
  rejected_returns: number
  escalated_returns: number
  evidence_requested_returns: number
  high_risk_returns: number
  approval_rate: number
  rejection_rate: number
  resolution_rate: number
  average_risk_score: number
  average_resolution_hours: number
  refund_exposure: number
  estimated_savings: number
  generated_at: string
}

export interface CustomerRiskInsight {
  customer_id: string
  total_returns: number
  high_risk_returns: number
  rejected_returns: number
  average_risk_score: number
  refund_exposure: number
  risk_rank: number
}

export interface ProductReturnInsight {
  product_name: string
  total_returns: number
  high_risk_returns: number
  rejected_returns: number
  average_risk_score: number
  refund_exposure: number
}

export interface RulePreview {
  human_review_threshold: number
  auto_approval_enabled: boolean
  auto_approval_max_score: number
  auto_rejection_enabled: boolean
  auto_rejection_min_score: number
  require_evidence: boolean
  evidence_minimum_images: number
  manual_override_enabled: boolean
  require_override_remarks: boolean
  category_rules: Record<string, unknown>
}

export interface MerchantIntelligenceDashboard {
  kpis: KPIOverview
  top_risky_customers: CustomerRiskInsight[]
  top_returned_products: ProductReturnInsight[]
  rules: RulePreview
}

export async function getMerchantIntelligence(): Promise<MerchantIntelligenceDashboard> {
  const response = await api.get<MerchantIntelligenceDashboard>(
    "/merchant-intelligence/dashboard",
  )
  return response.data
}
