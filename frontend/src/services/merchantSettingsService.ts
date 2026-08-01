import api from "./api"

export interface MerchantSettings {
  id: string
  owner_id: string

  business_name: string
  support_email: string
  support_phone: string
  website_url: string
  timezone: string
  currency: string

  low_risk_max: number
  medium_risk_max: number
  high_risk_max: number
  human_review_threshold: number

  auto_approval_enabled: boolean
  auto_approval_max_score: number
  auto_approval_max_amount: number
  auto_rejection_enabled: boolean
  auto_rejection_min_score: number

  require_evidence: boolean
  evidence_minimum_images: number
  evidence_required_above_amount: number
  allow_jpeg: boolean
  allow_png: boolean
  allow_webp: boolean
  maximum_upload_size_mb: number

  email_notifications: boolean
  high_risk_alerts: boolean
  review_assignment_alerts: boolean
  daily_summary_enabled: boolean
  weekly_report_enabled: boolean
  notification_email: string

  default_return_window_days: number
  returnless_refund_enabled: boolean
  returnless_refund_max_amount: number
  manual_override_enabled: boolean
  require_override_remarks: boolean

  product_category_rules: Record<string, unknown>

  created_at: string
  updated_at: string
}

export type MerchantProfilePayload = Pick<
  MerchantSettings,
  | "business_name"
  | "support_email"
  | "support_phone"
  | "website_url"
  | "timezone"
  | "currency"
>

export type RiskSettingsPayload = Pick<
  MerchantSettings,
  | "low_risk_max"
  | "medium_risk_max"
  | "high_risk_max"
  | "human_review_threshold"
>

export type AutomationSettingsPayload = Pick<
  MerchantSettings,
  | "auto_approval_enabled"
  | "auto_approval_max_score"
  | "auto_approval_max_amount"
  | "auto_rejection_enabled"
  | "auto_rejection_min_score"
  | "returnless_refund_enabled"
  | "returnless_refund_max_amount"
  | "default_return_window_days"
  | "manual_override_enabled"
  | "require_override_remarks"
>

export type EvidenceSettingsPayload = Pick<
  MerchantSettings,
  | "require_evidence"
  | "evidence_minimum_images"
  | "evidence_required_above_amount"
  | "allow_jpeg"
  | "allow_png"
  | "allow_webp"
  | "maximum_upload_size_mb"
>

export type NotificationSettingsPayload = Pick<
  MerchantSettings,
  | "email_notifications"
  | "high_risk_alerts"
  | "review_assignment_alerts"
  | "daily_summary_enabled"
  | "weekly_report_enabled"
  | "notification_email"
>

export interface ResetSettingsResponse {
  message: string
  settings: MerchantSettings
}

export const getMerchantSettings =
  async (): Promise<MerchantSettings> => {
    const response =
      await api.get<MerchantSettings>("/settings")

    return response.data
  }

export const updateMerchantProfile = async (
  payload: MerchantProfilePayload,
): Promise<MerchantSettings> => {
  const response = await api.patch<MerchantSettings>(
    "/settings/profile",
    payload,
  )

  return response.data
}

export const updateRiskSettings = async (
  payload: RiskSettingsPayload,
): Promise<MerchantSettings> => {
  const response = await api.patch<MerchantSettings>(
    "/settings/risk",
    payload,
  )

  return response.data
}

export const updateAutomationSettings = async (
  payload: AutomationSettingsPayload,
): Promise<MerchantSettings> => {
  const response = await api.patch<MerchantSettings>(
    "/settings/automation",
    payload,
  )

  return response.data
}

export const updateEvidenceSettings = async (
  payload: EvidenceSettingsPayload,
): Promise<MerchantSettings> => {
  const response = await api.patch<MerchantSettings>(
    "/settings/evidence",
    payload,
  )

  return response.data
}

export const updateNotificationSettings = async (
  payload: NotificationSettingsPayload,
): Promise<MerchantSettings> => {
  const response = await api.patch<MerchantSettings>(
    "/settings/notifications",
    payload,
  )

  return response.data
}

export const resetMerchantSettings =
  async (): Promise<ResetSettingsResponse> => {
    const response =
      await api.post<ResetSettingsResponse>(
        "/settings/reset",
      )

    return response.data
  }
