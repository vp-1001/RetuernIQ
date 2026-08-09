import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react"

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileQuestion,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  UserRound,
  X,
} from "lucide-react"

import { getApiErrorMessage } from "../lib/getApiErrorMessage"
import { useToast } from "../contexts/ToastContext"
import { useReturnEvidenceAI } from "../hooks/useEvidenceAI"
import AIReviewBanner from "../components/evidence/AIReviewBanner"

import {
  useReviewDetail,
  useReviewQueue,
  useReviewSummary,
  useSubmitReviewDecision,
} from "../hooks/useReviews"

import type {
  ReviewAction,
  ReviewQueueItem,
  ReviewStatus,
} from "../services/reviewService"

type StatusFilter = ReviewStatus | "all"

type DecisionDialogState = {
  open: boolean
  action: ReviewAction | null
}

const statusFilters: Array<{
  label: string
  value: StatusFilter
}> = [
  {
    label: "Pending",
    value: "pending",
  },
  {
    label: "Approved",
    value: "approved",
  },
  {
    label: "Rejected",
    value: "rejected",
  },
  {
    label: "Evidence Requested",
    value: "evidence_requested",
  },
  {
    label: "Escalated",
    value: "escalated",
  },
  {
    label: "All",
    value: "all",
  },
]

function formatLabel(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function getRiskClasses(riskLevel: string): string {
  switch (riskLevel.toLowerCase()) {
    case "critical":
      return "border-red-200 bg-red-50 text-red-700"

    case "high":
      return "border-orange-200 bg-orange-50 text-orange-700"

    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700"

    default:
      return "border-green-200 bg-green-50 text-green-700"
  }
}

function getStatusClasses(
  status: ReviewStatus,
): string {
  switch (status) {
    case "approved":
      return "border-green-200 bg-green-50 text-green-700"

    case "rejected":
      return "border-red-200 bg-red-50 text-red-700"

    case "evidence_requested":
      return "border-blue-200 bg-blue-50 text-blue-700"

    case "escalated":
      return "border-purple-200 bg-purple-50 text-purple-700"

    default:
      return "border-amber-200 bg-amber-50 text-amber-700"
  }
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-950">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
          {icon}
        </div>
      </div>
    </div>
  )
}

function ReviewQueueCard({
  review,
  selected,
  onSelect,
}: {
  review: ReviewQueueItem
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-blue-500 bg-blue-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-950">
            {review.product_name}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Order {review.order_id}
          </p>
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getRiskClasses(
            review.risk_level,
          )}`}
        >
          {formatLabel(review.risk_level)} Risk
        </span>

        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
            review.status,
          )}`}
        >
          {formatLabel(review.status)}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Risk score
        </p>

        <p className="text-sm font-bold text-slate-900">
          {review.risk_score}
        </p>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{
            width: `${Math.min(
              Math.max(review.risk_score, 0),
              100,
            )}%`,
          }}
        />
      </div>
    </button>
  )
}

function DecisionDialog({
  action,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  action: ReviewAction
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (remarks: string) => Promise<void>
}) {
  const [remarks, setRemarks] = useState("")
  const [validationError, setValidationError] =
    useState("")

  const requiresRemarks = action !== "approve"

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (requiresRemarks && !remarks.trim()) {
      setValidationError(
        "Remarks are required for this action.",
      )
      return
    }

    setValidationError("")
    await onSubmit(remarks.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {formatLabel(action)}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Confirm the final reviewer action for this
              return request.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6"
        >
          <label
            htmlFor="review-remarks"
            className="text-sm font-semibold text-slate-700"
          >
            Reviewer remarks
            {requiresRemarks && (
              <span className="text-red-600"> *</span>
            )}
          </label>

          <textarea
            id="review-remarks"
            rows={5}
            value={remarks}
            onChange={(event) =>
              setRemarks(event.target.value)
            }
            placeholder="Explain the reason for this decision..."
            className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          {validationError && (
            <p className="mt-2 text-sm text-red-600">
              {validationError}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              Confirm {formatLabel(action)}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function HumanReviewPage() {
  const { showToast } = useToast()

  const [status, setStatus] =
    useState<StatusFilter>("pending")

  const [searchInput, setSearchInput] =
    useState("")

  const [search, setSearch] = useState("")

  const [riskLevel, setRiskLevel] =
    useState("")

  const [selectedReturnId, setSelectedReturnId] =
    useState("")

  const [successMessage, setSuccessMessage] =
    useState("")

  const [decisionDialog, setDecisionDialog] =
    useState<DecisionDialogState>({
      open: false,
      action: null,
    })

  const filters = useMemo(
    () => ({
      status,
      riskLevel,
      search,
      limit: 50,
    }),
    [status, riskLevel, search],
  )

  const {
    data: reviews = [],
    isLoading: queueLoading,
    isFetching: queueFetching,
    isError: queueError,
    error: queueErrorDetails,
    refetch: refetchQueue,
  } = useReviewQueue(filters)

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useReviewSummary()

  useEffect(() => {
    if (
      reviews.length > 0 &&
      !reviews.some(
        (review) =>
          review.return_id === selectedReturnId,
      )
    ) {
      setSelectedReturnId(reviews[0].return_id)
    }

    if (reviews.length === 0) {
      setSelectedReturnId("")
    }
  }, [reviews, selectedReturnId])

  const {
    data: selectedReview,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErrorDetails,
    refetch: refetchDetail,
  } = useReviewDetail(selectedReturnId)

  const decisionMutation =
    useSubmitReviewDecision(selectedReturnId)

  const { data: aiSummary } =
    useReturnEvidenceAI(selectedReturnId)

  const handleSearch = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setSearch(searchInput.trim())
  }

  const openDecisionDialog = (
    action: ReviewAction,
  ) => {
    setSuccessMessage("")

    setDecisionDialog({
      open: true,
      action,
    })
  }

  const closeDecisionDialog = () => {
    if (decisionMutation.isPending) {
      return
    }

    setDecisionDialog({
      open: false,
      action: null,
    })
  }

  const handleDecision = async (
    remarks: string,
  ) => {
    if (!decisionDialog.action) {
      return
    }

    await decisionMutation.mutateAsync({
      action: decisionDialog.action,
      remarks: remarks || undefined,
    })

    const message = `Decision saved: ${formatLabel(
      decisionDialog.action,
    )}.`

    setSuccessMessage(message)
    showToast(message, "success")

    setSelectedReturnId("")

    if (
      decisionDialog.action === "approve" ||
      decisionDialog.action === "reject"
    ) {
      setStatus("pending")
    }

    await Promise.all([
      refetchQueue(),
      refetchSummary(),
    ])

    closeDecisionDialog()
  }

  const refreshEverything = async () => {
    await Promise.all([
      refetchQueue(),
      refetchSummary(),
      selectedReturnId
        ? refetchDetail()
        : Promise.resolve(),
    ])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">
            Human Review
          </h1>

          <p className="mt-2 text-slate-500">
            Review high-risk returns and override automated
            recommendations.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshEverything}
          disabled={queueFetching}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              queueFetching ? "animate-spin" : ""
            }`}
          />

          Refresh
        </button>
      </div>

      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      {decisionMutation.isError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-5 w-5" />
          {getApiErrorMessage(decisionMutation.error)}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          title="Total Reviews"
          value={summaryLoading ? 0 : summary?.total ?? 0}
          icon={<ShieldAlert className="h-6 w-6" />}
        />

        <SummaryCard
          title="Pending"
          value={summaryLoading ? 0 : summary?.pending ?? 0}
          icon={<Clock3 className="h-6 w-6" />}
        />

        <SummaryCard
          title="Approved"
          value={summaryLoading ? 0 : summary?.approved ?? 0}
          icon={<ThumbsUp className="h-6 w-6" />}
        />

        <SummaryCard
          title="Rejected"
          value={summaryLoading ? 0 : summary?.rejected ?? 0}
          icon={<ThumbsDown className="h-6 w-6" />}
        />

        <SummaryCard
          title="Escalated"
          value={summaryLoading ? 0 : summary?.escalated ?? 0}
          icon={<FileQuestion className="h-6 w-6" />}
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatus(filter.value)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  status === filter.value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <form
              onSubmit={handleSearch}
              className="flex flex-1 gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(event.target.value)
                  }
                  placeholder="Search order, customer or product..."
                  className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Search
              </button>
            </form>

            <select
              value={riskLevel}
              onChange={(event) =>
                setRiskLevel(event.target.value)
              }
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">All risk levels</option>
              <option value="low">Low risk</option>
              <option value="medium">Medium risk</option>
              <option value="high">High risk</option>
              <option value="critical">
                Critical risk
              </option>
            </select>
          </div>
        </div>
      </section>

      <div className="grid min-h-[650px] gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-950">
                Active Review Queue
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {reviews.length} return request
                {reviews.length === 1 ? "" : "s"}
              </p>
            </div>

            {queueFetching && (
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            )}
          </div>

          {queueLoading ? (
            <div className="flex min-h-96 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : queueError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-600" />

              <p className="mt-3 text-sm text-red-700">
                {getApiErrorMessage(queueErrorDetails)}
              </p>

              <button
                type="button"
                onClick={() => refetchQueue()}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Retry
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex min-h-96 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-5 text-center">
              <ShieldAlert className="h-10 w-10 text-slate-400" />

              <h3 className="mt-4 font-semibold text-slate-800">
                No reviews found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Change the filters or create a return that
                requires manual review.
              </p>
            </div>
          ) : (
            <div className="max-h-[700px] space-y-3 overflow-y-auto pr-1">
              {reviews.map((review) => (
                <ReviewQueueCard
                  key={review.return_id}
                  review={review}
                  selected={
                    selectedReturnId === review.return_id
                  }
                  onSelect={() =>
                    setSelectedReturnId(
                      review.return_id,
                    )
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {!selectedReturnId ? (
            <div className="flex min-h-[550px] flex-col items-center justify-center text-center">
              <ShieldAlert className="h-12 w-12 text-slate-300" />

              <h2 className="mt-4 text-xl font-semibold text-slate-800">
                Select a return
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Choose a return from the review queue.
              </p>
            </div>
          ) : detailLoading ? (
            <div className="flex min-h-[550px] items-center justify-center">
              <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
            </div>
          ) : detailError ? (
            <div className="flex min-h-[550px] flex-col items-center justify-center text-center">
              <AlertCircle className="h-10 w-10 text-red-500" />

              <p className="mt-4 text-sm text-red-700">
                {getApiErrorMessage(detailErrorDetails)}
              </p>
            </div>
          ) : selectedReview ? (
            <div>
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedReturnId("")
                    }
                    className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 xl:hidden"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>

                  <h2 className="text-2xl font-bold text-slate-950">
                    {selectedReview.product_name}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Return {selectedReview.return_id}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getRiskClasses(
                      selectedReview.risk_level,
                    )}`}
                  >
                    {formatLabel(
                      selectedReview.risk_level,
                    )}{" "}
                    Risk
                  </span>

                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                      selectedReview.status,
                    )}`}
                  >
                    {formatLabel(selectedReview.status)}
                  </span>
                </div>
              </div>

              {aiSummary && (
                <div className="mt-6">
                  <AIReviewBanner summary={aiSummary}/>
                </div>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Order ID
                  </p>

                  <p className="mt-2 font-semibold text-slate-950">
                    {selectedReview.order_id}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Customer ID
                  </p>

                  <p className="mt-2 font-semibold text-slate-950">
                    {selectedReview.customer_id}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Risk Score
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {selectedReview.risk_score}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  AI Recommendation
                </p>

                <h3 className="mt-2 text-lg font-bold text-blue-950">
                  {formatLabel(
                    selectedReview.recommendation,
                  )}
                </h3>

                <p className="mt-2 text-sm leading-6 text-blue-800">
                  {String(
                    selectedReview.assessment_payload[
                      "recommendation_reason"
                    ] ??
                      "The automated risk engine generated this recommendation based on the available return data.",
                  )}
                </p>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="font-bold text-slate-950">
                    Return Information
                  </h3>

                  <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <pre className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-700">
                      {JSON.stringify(
                        selectedReview.request_payload,
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-950">
                    Assessment Information
                  </h3>

                  <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <pre className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-700">
                      {JSON.stringify(
                        selectedReview.assessment_payload,
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-bold text-slate-950">
                  Audit Timeline
                </h3>

                {selectedReview.audit_trail.length ===
                0 ? (
                  <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    No reviewer decisions have been recorded
                    yet.
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {selectedReview.audit_trail.map(
                      (decision) => (
                        <div
                          key={decision.id}
                          className="flex gap-4 rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                            <UserRound className="h-5 w-5 text-slate-600" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <p className="font-semibold text-slate-900">
                                {decision.reviewer.full_name}
                              </p>

                              <p className="text-xs text-slate-500">
                                {formatDate(
                                  decision.created_at,
                                )}
                              </p>
                            </div>

                            <p className="mt-1 text-sm text-slate-600">
                              Changed status from{" "}
                              <strong>
                                {formatLabel(
                                  decision.previous_status,
                                )}
                              </strong>{" "}
                              to{" "}
                              <strong>
                                {formatLabel(
                                  decision.new_status,
                                )}
                              </strong>
                              .
                            </p>

                            {decision.remarks && (
                              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                {decision.remarks}
                              </p>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
                <button
                  type="button"
                  onClick={() =>
                    openDecisionDialog("approve")
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Approve
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openDecisionDialog("reject")
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                >
                  <ThumbsDown className="h-4 w-4" />
                  Reject
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openDecisionDialog(
                      "request_evidence",
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                >
                  <FileQuestion className="h-4 w-4" />
                  Request Evidence
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openDecisionDialog("escalate")
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-purple-300 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-100"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Escalate
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {decisionDialog.open &&
        decisionDialog.action && (
          <DecisionDialog
            action={decisionDialog.action}
            isSubmitting={
              decisionMutation.isPending
            }
            onClose={closeDecisionDialog}
            onSubmit={handleDecision}
          />
        )}
    </div>
  )
}

export default HumanReviewPage