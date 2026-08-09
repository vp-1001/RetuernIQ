import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react"

import type { ReturnEvidenceSummary } from "../../services/evidenceAIService"

interface AIReviewBannerProps {
  summary?: ReturnEvidenceSummary
  compact?: boolean
}

function AIReviewBanner({
  summary,
  compact = false,
}: AIReviewBannerProps) {
  if (!summary || summary.analyzed_count === 0) {
    return null
  }

  const blocked =
    summary.severe_approval_block

  return (
    <div
      className={`rounded-2xl border p-4 ${
        blocked
          ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
          : "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
      }`}
    >
      <div className="flex items-start gap-3">
        {blocked ? (
          <ShieldAlert className="mt-0.5 h-5 w-5 text-red-600" />
        ) : (
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
        )}

        <div>
          <p
            className={`font-bold ${
              blocked
                ? "text-red-800 dark:text-red-200"
                : "text-emerald-800 dark:text-emerald-200"
            }`}
          >
            {blocked
              ? "AI approval block active"
              : "AI evidence verification clear"}
          </p>

          <p
            className={`mt-1 text-sm leading-6 ${
              blocked
                ? "text-red-700 dark:text-red-300"
                : "text-emerald-700 dark:text-emerald-300"
            }`}
          >
            {summary.explanation}
          </p>

          {!compact && blocked && (
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-700 dark:text-red-300">
              <AlertTriangle className="h-4 w-4" />
              Approval requires a detailed reviewer override reason.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIReviewBanner
