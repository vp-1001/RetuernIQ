import {
  AlertCircle,
  Bot,
  FileSearch,
  Loader2,
  Play,
  RefreshCw,
  ScanSearch,
} from "lucide-react"
import {
  useEffect,
  useMemo,
  useState,
} from "react"

import AIAnalysisCard from "../components/evidence/AIAnalysisCard"
import AIVerificationSummary from "../components/evidence/AIVerificationSummary"
import AIVerificationDetails from "../components/evidence/AIVerificationDetails"
import AITimeline from "../components/evidence/AITimeline"
import {
  useAnalyzeReturnEvidence,
  useEvidenceAIHealth,
  useReturnEvidenceAI,
} from "../hooks/useEvidenceAI"
import { useReturns } from "../hooks/useReturns"
import { useToast } from "../contexts/ToastContext"
import { getApiErrorMessage } from "../lib/getApiErrorMessage"

function AIEvidencePage() {
  const { showToast } = useToast()

  const {
    data: returns = [],
    isLoading: returnsLoading,
  } = useReturns()

  const [selectedReturnId, setSelectedReturnId] =
    useState("")

  const activeReturns = useMemo(
    () =>
      returns.filter((item) =>
        [
          "pending",
          "evidence_requested",
          "escalated",
        ].includes(item.status ?? "pending"),
      ),
    [returns],
  )

  useEffect(() => {
    if (
      !selectedReturnId &&
      activeReturns.length > 0
    ) {
      setSelectedReturnId(
        activeReturns[0].return_id,
      )
    }
  }, [activeReturns, selectedReturnId])

  const health = useEvidenceAIHealth()

  const {
    data: summary,
    isLoading: summaryLoading,
    isFetching: summaryFetching,
    refetch: refetchSummary,
    error: summaryError,
  } = useReturnEvidenceAI(
    selectedReturnId,
  )

  const analyzeMutation =
    useAnalyzeReturnEvidence(
      selectedReturnId,
    )

  const runAnalysis = async (
    force = false,
  ) => {
    if (!selectedReturnId) {
      showToast(
        "Select a return first.",
        "error",
      )
      return
    }

    try {
      await analyzeMutation.mutateAsync(force)

      showToast(
        "AI evidence analysis completed.",
        "success",
      )
    } catch (error) {
      showToast(
        getApiErrorMessage(error),
        "error",
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-300">
            <Bot className="h-5 w-5" />
            <p className="text-sm font-bold uppercase tracking-[0.14em]">
              Phase 8 intelligence
            </p>
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            AI Evidence Verification
          </h1>

          <p className="mt-2 max-w-3xl text-slate-500 dark:text-slate-400">
            Detect product mismatches, duplicate images, OCR identifiers and evidence-based fraud signals.
          </p>
        </div>

        <button
          type="button"
          onClick={() => runAnalysis(true)}
          disabled={
            !selectedReturnId ||
            analyzeMutation.isPending
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {analyzeMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Analyze all evidence
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <label
            htmlFor="ai-return"
            className="text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Return request
          </label>

          {returnsLoading ? (
            <div className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm text-slate-500 dark:border-slate-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading returns...
            </div>
          ) : (
            <select
              id="ai-return"
              value={selectedReturnId}
              onChange={(event) =>
                setSelectedReturnId(
                  event.target.value,
                )
              }
              className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {activeReturns.length === 0 && (
                <option value="">
                  No active returns
                </option>
              )}

              {activeReturns.map((item) => (
                <option
                  key={item.return_id}
                  value={item.return_id}
                >
                  {item.request_payload
                    ?.product_name ??
                    "Product"}{" "}
                  — {item.return_id.slice(0, 8)}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            AI runtime
          </p>

          {health.isLoading ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking model...
            </div>
          ) : (
            <div className="mt-3 space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    health.data
                      ?.clip_available
                      ? "bg-emerald-500"
                      : "bg-red-500"
                  }`}
                />
                CLIP vision:{" "}
                {health.data?.clip_available
                  ? "Ready"
                  : "Unavailable"}
              </p>

              <p className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    health.data
                      ?.ocr_available
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}
                />
                OCR:{" "}
                {health.data?.ocr_available
                  ? "Ready"
                  : "Unavailable"}
              </p>

              <p className="text-xs text-slate-500">
                Device:{" "}
                {health.data?.device ??
                  "unknown"}
              </p>
            </div>
          )}
        </div>
      </section>

      {summaryLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
            <p className="mt-3 text-sm text-slate-500">
              Loading AI evidence results...
            </p>
          </div>
        </div>
      ) : summary ? (
        <>
          <AIVerificationSummary
            summary={summary}
          />

          <AIVerificationDetails
            verification={
              summary.analyses[0]?.verification ??
              summary.analyses[0]?.raw_predictions
                ?.verification
            }
            consistency={
              summary.multi_image_consistency
            }
          />

          <AITimeline items={summary.timeline} />

          <section>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                  Individual analyses
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Detailed output for each uploaded image.
                </p>
              </div>

              <button
                type="button"
                onClick={() => refetchSummary()}
                disabled={summaryFetching}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    summaryFetching
                      ? "animate-spin"
                      : ""
                  }`}
                />
                Refresh
              </button>
            </div>

            <div className="mt-4 grid gap-5 xl:grid-cols-2">
              {summary.analyses.map(
                (analysis) => (
                  <AIAnalysisCard
                    key={analysis.id}
                    analysis={analysis}
                  />
                ),
              )}
            </div>
          </section>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          {summaryError ? (
            <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
          ) : (
            <FileSearch className="mx-auto h-12 w-12 text-slate-300" />
          )}

          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            No AI analysis yet
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">
            Upload evidence for the selected return, then run AI verification to detect product type, OCR text, duplicates and fraud signals.
          </p>
        </div>
      )}

      {analyzeMutation.isPending && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-2xl">
          <ScanSearch className="h-4 w-4 animate-pulse" />
          Running image classification and OCR...
        </div>
      )}
    </div>
  )
}

export default AIEvidencePage
