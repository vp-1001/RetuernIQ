export interface CustomerHistory {
  total_orders: number
  total_returns: number
  account_age_days: number
  repeated_damage_claims: number
}

export interface FinancialData {
  refund_amount: number
  reverse_shipping_cost: number
  inspection_cost: number
  repair_cost: number
  disposal_cost: number
  recoverable_resale_value: number
}

export interface CreateReturnPayload {
  merchant_id: string
  external_return_id: string
  order_id: string
  customer_id: string
  product_name: string
  product_category: string
  product_price: number
  return_reason: string
  days_after_delivery: number
  missing_accessories: boolean
  duplicate_image_detected: boolean
  image_mismatch_detected: boolean
  customer_history: CustomerHistory
  financial_data: FinancialData
}

export interface RiskFactor {
  name: string
  impact: number
  explanation: string
}

export interface FinancialImpact {
  estimated_loss: number
  refund_amount: number
  operational_cost: number
  recoverable_value: number
}

export interface ReturnAssessment {
  return_id: string
  risk_score: number
  risk_level: string
  confidence: number
  factors: RiskFactor[]
  recommendation: string
  recommendation_reason: string
  human_review_required: boolean
  automatic_rejection_allowed: boolean
  financial_impact: FinancialImpact
}

export type ReturnRequest = ReturnAssessment

export interface DashboardMetrics {
  totalReturns: number
  pendingReview: number
  highRiskCases: number
  refundExposure: number
}