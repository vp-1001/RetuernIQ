import {
  Bell,
  BrainCircuit,
  Building2,
  FileImage,
  Loader2,
  Moon,
  RotateCcw,
  Save,
  ShieldCheck,
  Sun,
  Monitor,
} from "lucide-react"
import {
  useEffect,
  useState,
  type ReactNode,
} from "react"

import ConfirmDialog from "../components/common/ConfirmDialog"
import SettingSection from "../components/settings/SettingSection"
import {
  useMerchantSettings,
  useResetMerchantSettings,
  useUpdateAutomationSettings,
  useUpdateEvidenceSettings,
  useUpdateMerchantProfile,
  useUpdateNotificationSettings,
  useUpdateRiskSettings,
} from "../hooks/useMerchantSettings"
import {
  useTheme,
  type ThemeMode,
} from "../contexts/ThemeContext"
import { useToast } from "../contexts/ToastContext"
import type { MerchantSettings } from "../services/merchantSettingsService"

function errorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            detail?: string
          }
        }
      }
    ).response

    if (response?.data?.detail) {
      return response.data.detail
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Unable to save settings."
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition ${
        checked ? "bg-blue-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  )
}

function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { showToast } = useToast()

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useMerchantSettings()

  const profileMutation =
    useUpdateMerchantProfile()
  const riskMutation = useUpdateRiskSettings()
  const automationMutation =
    useUpdateAutomationSettings()
  const evidenceMutation =
    useUpdateEvidenceSettings()
  const notificationMutation =
    useUpdateNotificationSettings()
  const resetMutation =
    useResetMerchantSettings()

  const [form, setForm] =
    useState<MerchantSettings | null>(null)

  const [resetOpen, setResetOpen] =
    useState(false)

  useEffect(() => {
    if (data) {
      setForm(data)
    }
  }, [data])

  const update = <K extends keyof MerchantSettings>(
    key: K,
    value: MerchantSettings[K],
  ) => {
    setForm((current) =>
      current
        ? {
            ...current,
            [key]: value,
          }
        : current,
    )
  }

  const saveAll = async () => {
    if (!form) {
      return
    }

    try {
      await profileMutation.mutateAsync({
        business_name: form.business_name,
        support_email: form.support_email,
        support_phone: form.support_phone,
        website_url: form.website_url,
        timezone: form.timezone,
        currency: form.currency,
      })

      await riskMutation.mutateAsync({
        low_risk_max: form.low_risk_max,
        medium_risk_max:
          form.medium_risk_max,
        high_risk_max: form.high_risk_max,
        human_review_threshold:
          form.human_review_threshold,
      })

      await automationMutation.mutateAsync({
        auto_approval_enabled:
          form.auto_approval_enabled,
        auto_approval_max_score:
          form.auto_approval_max_score,
        auto_approval_max_amount:
          form.auto_approval_max_amount,
        auto_rejection_enabled:
          form.auto_rejection_enabled,
        auto_rejection_min_score:
          form.auto_rejection_min_score,
        returnless_refund_enabled:
          form.returnless_refund_enabled,
        returnless_refund_max_amount:
          form.returnless_refund_max_amount,
        default_return_window_days:
          form.default_return_window_days,
        manual_override_enabled:
          form.manual_override_enabled,
        require_override_remarks:
          form.require_override_remarks,
      })

      await evidenceMutation.mutateAsync({
        require_evidence:
          form.require_evidence,
        evidence_minimum_images:
          form.evidence_minimum_images,
        evidence_required_above_amount:
          form.evidence_required_above_amount,
        allow_jpeg: form.allow_jpeg,
        allow_png: form.allow_png,
        allow_webp: form.allow_webp,
        maximum_upload_size_mb:
          form.maximum_upload_size_mb,
      })

      await notificationMutation.mutateAsync({
        email_notifications:
          form.email_notifications,
        high_risk_alerts:
          form.high_risk_alerts,
        review_assignment_alerts:
          form.review_assignment_alerts,
        daily_summary_enabled:
          form.daily_summary_enabled,
        weekly_report_enabled:
          form.weekly_report_enabled,
        notification_email:
          form.notification_email,
      })

      showToast(
        "Merchant settings saved successfully.",
        "success",
      )
    } catch (saveError) {
      showToast(
        errorMessage(saveError),
        "error",
      )
    }
  }

  const resetSettings = async () => {
    try {
      const response =
        await resetMutation.mutateAsync()

      setForm(response.settings)
      setResetOpen(false)

      showToast(response.message, "success")
    } catch (resetError) {
      showToast(
        errorMessage(resetError),
        "error",
      )
    }
  }

  const saving =
    profileMutation.isPending ||
    riskMutation.isPending ||
    automationMutation.isPending ||
    evidenceMutation.isPending ||
    notificationMutation.isPending

  if (isLoading || !form) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-600" />
          <p className="mt-3 text-sm text-slate-500">
            Loading merchant settings...
          </p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-semibold text-red-800">
          {errorMessage(error)}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    )
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white">
            Merchant Settings
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Configure policies, automation, evidence and
            operational preferences.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>

          <button
            type="button"
            onClick={saveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      <SettingSection
        title="Merchant Profile"
        description="Business identity and operational defaults."
        icon={<Building2 className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Business name">
            <input
              value={form.business_name}
              onChange={(event) =>
                update(
                  "business_name",
                  event.target.value,
                )
              }
              className={inputClass}
            />
          </Field>

          <Field label="Support email">
            <input
              type="email"
              value={form.support_email}
              onChange={(event) =>
                update(
                  "support_email",
                  event.target.value,
                )
              }
              className={inputClass}
            />
          </Field>

          <Field label="Support phone">
            <input
              value={form.support_phone}
              onChange={(event) =>
                update(
                  "support_phone",
                  event.target.value,
                )
              }
              className={inputClass}
            />
          </Field>

          <Field label="Website URL">
            <input
              value={form.website_url}
              onChange={(event) =>
                update(
                  "website_url",
                  event.target.value,
                )
              }
              className={inputClass}
            />
          </Field>

          <Field label="Timezone">
            <input
              value={form.timezone}
              onChange={(event) =>
                update(
                  "timezone",
                  event.target.value,
                )
              }
              className={inputClass}
            />
          </Field>

          <Field label="Currency">
            <input
              value={form.currency}
              onChange={(event) =>
                update(
                  "currency",
                  event.target.value.toUpperCase(),
                )
              }
              className={inputClass}
            />
          </Field>
        </div>
      </SettingSection>

      <SettingSection
        title="Risk Configuration"
        description="Define thresholds used by the decision engine."
        icon={<ShieldCheck className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["low_risk_max", "Low risk maximum"],
            [
              "medium_risk_max",
              "Medium risk maximum",
            ],
            ["high_risk_max", "High risk maximum"],
            [
              "human_review_threshold",
              "Human review threshold",
            ],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                type="number"
                min="0"
                max="100"
                value={
                  form[
                    key as keyof MerchantSettings
                  ] as number
                }
                onChange={(event) =>
                  update(
                    key as keyof MerchantSettings,
                    Number(event.target.value) as never,
                  )
                }
                className={inputClass}
              />
            </Field>
          ))}
        </div>
      </SettingSection>

      <SettingSection
        title="Automation Rules"
        description="Control automatic approval, rejection and overrides."
        icon={<BrainCircuit className="h-5 w-5" />}
      >
        <div className="space-y-5">
          {[
            [
              "auto_approval_enabled",
              "Enable automatic approval",
            ],
            [
              "auto_rejection_enabled",
              "Enable automatic rejection",
            ],
            [
              "returnless_refund_enabled",
              "Enable returnless refunds",
            ],
            [
              "manual_override_enabled",
              "Allow manual overrides",
            ],
            [
              "require_override_remarks",
              "Require override remarks",
            ],
          ].map(([key, label]) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700"
            >
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {label}
              </span>
              <Toggle
                checked={
                  form[
                    key as keyof MerchantSettings
                  ] as boolean
                }
                onChange={(checked) =>
                  update(
                    key as keyof MerchantSettings,
                    checked as never,
                  )
                }
              />
            </div>
          ))}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Auto-approval max score">
              <input
                type="number"
                value={form.auto_approval_max_score}
                onChange={(event) =>
                  update(
                    "auto_approval_max_score",
                    Number(event.target.value),
                  )
                }
                className={inputClass}
              />
            </Field>

            <Field label="Auto-approval max amount">
              <input
                type="number"
                value={form.auto_approval_max_amount}
                onChange={(event) =>
                  update(
                    "auto_approval_max_amount",
                    Number(event.target.value),
                  )
                }
                className={inputClass}
              />
            </Field>

            <Field label="Auto-rejection min score">
              <input
                type="number"
                value={form.auto_rejection_min_score}
                onChange={(event) =>
                  update(
                    "auto_rejection_min_score",
                    Number(event.target.value),
                  )
                }
                className={inputClass}
              />
            </Field>

            <Field label="Returnless refund maximum">
              <input
                type="number"
                value={
                  form.returnless_refund_max_amount
                }
                onChange={(event) =>
                  update(
                    "returnless_refund_max_amount",
                    Number(event.target.value),
                  )
                }
                className={inputClass}
              />
            </Field>

            <Field label="Default return window">
              <input
                type="number"
                value={
                  form.default_return_window_days
                }
                onChange={(event) =>
                  update(
                    "default_return_window_days",
                    Number(event.target.value),
                  )
                }
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </SettingSection>

      <SettingSection
        title="Evidence Policy"
        description="Configure upload requirements and accepted formats."
        icon={<FileImage className="h-5 w-5" />}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <span className="font-medium text-slate-800 dark:text-slate-200">
              Require evidence
            </span>
            <Toggle
              checked={form.require_evidence}
              onChange={(checked) =>
                update(
                  "require_evidence",
                  checked,
                )
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Minimum images">
              <input
                type="number"
                value={
                  form.evidence_minimum_images
                }
                onChange={(event) =>
                  update(
                    "evidence_minimum_images",
                    Number(event.target.value),
                  )
                }
                className={inputClass}
              />
            </Field>

            <Field label="Required above amount">
              <input
                type="number"
                value={
                  form.evidence_required_above_amount
                }
                onChange={(event) =>
                  update(
                    "evidence_required_above_amount",
                    Number(event.target.value),
                  )
                }
                className={inputClass}
              />
            </Field>

            <Field label="Maximum upload size (MB)">
              <input
                type="number"
                value={
                  form.maximum_upload_size_mb
                }
                onChange={(event) =>
                  update(
                    "maximum_upload_size_mb",
                    Number(event.target.value),
                  )
                }
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              ["allow_jpeg", "JPEG"],
              ["allow_png", "PNG"],
              ["allow_webp", "WebP"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700"
              >
                <input
                  type="checkbox"
                  checked={
                    form[
                      key as keyof MerchantSettings
                    ] as boolean
                  }
                  onChange={(event) =>
                    update(
                      key as keyof MerchantSettings,
                      event.target.checked as never,
                    )
                  }
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </SettingSection>

      <SettingSection
        title="Notifications"
        description="Choose which operational alerts should be delivered."
        icon={<Bell className="h-5 w-5" />}
      >
        <div className="space-y-4">
          {[
            [
              "email_notifications",
              "Email notifications",
            ],
            [
              "high_risk_alerts",
              "High-risk alerts",
            ],
            [
              "review_assignment_alerts",
              "Review assignment alerts",
            ],
            [
              "daily_summary_enabled",
              "Daily summary",
            ],
            [
              "weekly_report_enabled",
              "Weekly report",
            ],
          ].map(([key, label]) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700"
            >
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {label}
              </span>
              <Toggle
                checked={
                  form[
                    key as keyof MerchantSettings
                  ] as boolean
                }
                onChange={(checked) =>
                  update(
                    key as keyof MerchantSettings,
                    checked as never,
                  )
                }
              />
            </div>
          ))}

          <Field label="Notification email">
            <input
              type="email"
              value={form.notification_email}
              onChange={(event) =>
                update(
                  "notification_email",
                  event.target.value,
                )
              }
              className={inputClass}
            />
          </Field>
        </div>
      </SettingSection>

      <SettingSection
        title="Appearance"
        description="Choose the interface theme used on this device."
        icon={
          theme === "dark" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ["light", "Light", Sun],
              ["dark", "Dark", Moon],
              ["system", "System", Monitor],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setTheme(value as ThemeMode)
              }
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-4 text-sm font-semibold transition ${
                theme === value
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </SettingSection>

      <ConfirmDialog
        open={resetOpen}
        title="Reset merchant settings?"
        description="This will restore all merchant policies and preferences to their default values."
        confirmLabel="Reset Settings"
        destructive
        loading={resetMutation.isPending}
        onConfirm={resetSettings}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  )
}

export default SettingsPage
