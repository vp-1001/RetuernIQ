import {
  Barcode,
  FileSearch,
  Fingerprint,
  ScanSearch,
  ShieldAlert,
} from "lucide-react"

import { useAIAnalytics } from "../../hooks/useEvidenceAI"

function AIAnalyticsStrip() {
  const { data, isLoading, isError } =
    useAIAnalytics()

  if (isLoading || isError || !data) {
    return null
  }

  const metrics = [
    {
      label: "AI analyses",
      value: data.total_analyses,
      icon: ScanSearch,
    },
    {
      label: "Product mismatches",
      value: data.mismatched,
      icon: ShieldAlert,
    },
    {
      label: "Duplicate images",
      value: data.duplicates,
      icon: Fingerprint,
    },
    {
      label: "OCR success",
      value: `${data.ocr_success_rate.toFixed(
        1,
      )}%`,
      icon: FileSearch,
    },
    {
      label: "Codes detected",
      value: data.barcode_or_qr_detected,
      icon: Barcode,
    },
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric) => {
        const Icon = metric.icon

        return (
          <article
            key={metric.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  {metric.label}
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                  {metric.value}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}

export default AIAnalyticsStrip
