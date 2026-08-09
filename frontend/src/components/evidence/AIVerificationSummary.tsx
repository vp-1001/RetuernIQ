import {
  AlertTriangle,
  CheckCircle2,
  Fingerprint,
  ScanSearch,
  ShieldAlert,
} from "lucide-react"

import type { ReturnEvidenceSummary } from "../../services/evidenceAIService"

interface AIVerificationSummaryProps {
  summary: ReturnEvidenceSummary
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`
}

function label(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

function AIVerificationSummary({
  summary,
}: AIVerificationSummaryProps) {
  const healthy =
    summary.mismatched_count === 0 &&
    summary.duplicate_count === 0 &&
    summary.analyzed_count > 0

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-300">
            <ScanSearch className="h-5 w-5" />
            <p className="text-sm font-bold uppercase tracking-[0.14em]">
              AI evidence summary
            </p>
          </div>

          <h2 className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">
            {summary.expected_product}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {summary.explanation}
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-sm font-bold ${
            healthy
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
          }`}
        >
          {healthy ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {label(summary.recommended_action)}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
          <p className="text-xs font-bold uppercase text-slate-500">
            Analyzed
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
            {summary.analyzed_count}/
            {summary.evidence_count}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
          <p className="text-xs font-bold uppercase text-slate-500">
            Matched
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-300">
            {summary.matched_count}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
          <p className="text-xs font-bold uppercase text-slate-500">
            Mismatched
          </p>
          <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-300">
            {summary.mismatched_count}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
          <p className="text-xs font-bold uppercase text-slate-500">
            Similarity
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-300">
            {percent(
              summary.average_similarity,
            )}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
          <p className="text-xs font-bold uppercase text-slate-500">
            Risk adjustment
          </p>
          <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-300">
            +{summary.total_risk_adjustment}
          </p>
        </div>
      </div>

      {(summary.duplicate_count > 0 ||
        summary.mismatched_count > 0) && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {summary.mismatched_count > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-700 dark:text-red-300" />
                <p className="font-semibold text-red-800 dark:text-red-200">
                  Product mismatch
                </p>
              </div>

              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                {summary.mismatched_count} image
                {summary.mismatched_count === 1
                  ? ""
                  : "s"}{" "}
                did not match the claimed product.
              </p>
            </div>
          )}

          {summary.duplicate_count > 0 && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/30">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-purple-700 dark:text-purple-300" />
                <p className="font-semibold text-purple-800 dark:text-purple-200">
                  Duplicate evidence
                </p>
              </div>

              <p className="mt-2 text-sm text-purple-700 dark:text-purple-300">
                {summary.duplicate_count} duplicate
                image
                {summary.duplicate_count === 1
                  ? ""
                  : "s"}{" "}
                detected.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default AIVerificationSummary
