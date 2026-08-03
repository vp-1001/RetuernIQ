export type ProductCategory =
  | "electronics"
  | "fashion"
  | "footwear"
  | "beauty"
  | "home"
  | "other"

export type RiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical"

export type ReturnStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "evidence_requested"
  | "escalated"

export type Recommendation =
  | "instant_refund"
  | "approve_refund"
  | "request_evidence"
  | "manual_inspection"
  | "senior_review"

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
  product_category: ProductCategory
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

export interface ReturnRequestPayload extends CreateReturnPayload {
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  shipping_address?: string
  marketplace_order_id?: string
  shipment_id?: string
  tracking_id?: string
  purchase_date?: string
  delivery_date?: string
  payment_method?: string
  return_type?: string
  customer_comment?: string
  brand?: string
  sku?: string
  asin?: string
  serial_number?: string
  variant?: string
}

export interface ReturnAssessment {
  return_id: string
  status: ReturnStatus
  risk_score: number
  risk_level: RiskLevel
  confidence: number
  factors: RiskFactor[]
  recommendation: Recommendation
  recommendation_reason: string
  human_review_required: boolean
  automatic_rejection_allowed: boolean
  financial_impact: FinancialImpact
  request_payload: ReturnRequestPayload
  created_at?: string | null
  updated_at?: string | null
}

export interface ReturnRequest extends ReturnAssessment {}

export interface DashboardMetrics {
  totalReturns: number
  pendingReview: number
  highRiskCases: number
  refundExposure: number
}