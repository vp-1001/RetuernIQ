import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileText,
  Fingerprint,
  ScanSearch,
  ShieldAlert,
} from "lucide-react"

import type { EvidenceAIAnalysis } from "../../services/evidenceAIService"

interface AIAnalysisCardProps {
  analysis: EvidenceAIAnalysis
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

function AIAnalysisCard({
  analysis,
}: AIAnalysisCardProps) {
  const isMatch =
    analysis.match_status === "match"

  const isMismatch =
    analysis.match_status === "mismatch"

  const statusClass = isMatch
    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
    : isMismatch
      ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
      : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"

  const StatusIcon = isMatch
    ? CheckCircle2
    : AlertTriangle

  const identifiers = [
    [
      "Order IDs",
      analysis.extracted_identifiers
        .order_ids ?? [],
    ],
    [
      "Serial Numbers",
      analysis.extracted_identifiers
        .serial_numbers ?? [],
    ],
    [
      "IMEI Numbers",
      analysis.extracted_identifiers
        .imei_numbers ?? [],
    ],
    [
      "Tracking Numbers",
      analysis.extracted_identifiers
        .tracking_numbers ?? [],
    ],
  ].filter(([, values]) =>
    (values as string[]).length > 0,
  )

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            Evidence {analysis.evidence_id.slice(0, 8)}
          </p>

          <h3 className="mt-2 text-lg font-bold text-slate-950 dark:text-white">
            {analysis.detected_label}
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Expected: {analysis.expected_product}
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}
        >
          <StatusIcon className="h-4 w-4" />
          {label(analysis.match_status)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Detection confidence
          </p>

          <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
            {percent(
              analysis.detection_confidence,
            )}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Product similarity
          </p>

          <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
            {percent(
              analysis.similarity_score,
            )}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Risk adjustment
          </p>

          <p className="mt-2 text-xl font-bold text-red-600 dark:text-red-300">
            +{analysis.risk_adjustment}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <ScanSearch className="h-4 w-4 text-blue-600" />
          <p className="font-semibold text-slate-900 dark:text-white">
            AI explanation
          </p>
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {analysis.explanation}
        </p>
      </div>

      {analysis.fraud_signals.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-600" />
            <p className="font-semibold text-slate-900 dark:text-white">
              Fraud signals
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {analysis.fraud_signals.map(
              (signal) => (
                <span
                  key={signal}
                  className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300"
                >
                  {label(signal)}
                </span>
              ),
            )}
          </div>
        </div>
      )}

      {analysis.duplicate_detected && (
        <div className="mt-5 rounded-xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/30">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-purple-700 dark:text-purple-300" />

            <p className="font-semibold text-purple-800 dark:text-purple-200">
              Duplicate evidence detected
            </p>
          </div>

          <p className="mt-2 text-sm text-purple-700 dark:text-purple-300">
            This image matches previously submitted evidence.
          </p>
        </div>
      )}

      {(analysis.ocr_text ||
        identifiers.length > 0) && (
        <div className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />

            <p className="font-semibold text-slate-900 dark:text-white">
              OCR and identifiers
            </p>
          </div>

          {analysis.ocr_text && (
            <div className="mt-3 rounded-lg bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
              {analysis.ocr_text}
            </div>
          )}

          {identifiers.map(
            ([title, values]) => (
              <div
                key={title as string}
                className="mt-3"
              >
                <p className="text-xs font-bold uppercase text-slate-500">
                  {title as string}
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {(values as string[]).map(
                    (value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            value,
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <Copy className="h-3 w-3" />
                        {value}
                      </button>
                    ),
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </article>
  )
}

export default AIAnalysisCard
