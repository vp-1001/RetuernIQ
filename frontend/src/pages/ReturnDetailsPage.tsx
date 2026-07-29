import {
  AlertTriangle,
  ArrowLeft,
  BadgeIndianRupee,
  CheckCircle2,
  Clock3,
  Package,
  ShieldAlert,
  Sparkles,
} from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { useReturn } from "../hooks/useReturn"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function getRiskClasses(riskLevel: string) {
  const level = riskLevel.toLowerCase()

  if (level === "high") {
    return "border-red-200 bg-red-50 text-red-700"
  }

  if (level === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }

  return "border-green-200 bg-green-50 text-green-700"
}

function ReturnDetailsPage() {
  const navigate = useNavigate()
  const { returnId } = useParams()

  const {
    data: returnItem,
    isLoading,
    isError,
    refetch,
  } = useReturn(returnId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-52 animate-pulse rounded-xl bg-slate-200" />

        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>

        <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    )
  }

  if (isError || !returnItem) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />

        <h1 className="mt-4 text-xl font-semibold text-slate-950">
          Return details could not be loaded
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          The return may not exist, or the backend server may be unavailable.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/returns")}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to returns
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const riskLevel = returnItem.risk_level.toLowerCase()

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <button
            type="button"
            onClick={() => navigate("/returns")}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to returns
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-950">
              Return Details
            </h1>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getRiskClasses(
                returnItem.risk_level,
              )}`}
            >
              {formatLabel(returnItem.risk_level)} Risk
            </span>
          </div>

          <p className="mt-2 break-all text-sm text-slate-500">
            Return ID: {returnItem.return_id}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            Reject
          </button>

          <button
            type="button"
            className="rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
          >
            Send to review
          </button>

          <button
            type="button"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Approve refund
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Risk Score
            </p>

            <ShieldAlert
              className={`h-5 w-5 ${
                riskLevel === "high"
                  ? "text-red-500"
                  : riskLevel === "medium"
                    ? "text-amber-500"
                    : "text-green-500"
              }`}
            />
          </div>

          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {returnItem.risk_score}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Confidence
            </p>

            <Sparkles className="h-5 w-5 text-blue-600" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {Math.round(returnItem.confidence * 100)}%
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Refund Amount
            </p>

            <BadgeIndianRupee className="h-5 w-5 text-blue-600" />
          </div>

          <p className="mt-3 text-2xl font-semibold text-slate-950">
            {formatCurrency(
              returnItem.financial_impact.refund_amount,
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Human Review
            </p>

            {returnItem.human_review_required ? (
              <Clock3 className="h-5 w-5 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
          </div>

          <p className="mt-3 text-lg font-semibold text-slate-950">
            {returnItem.human_review_required
              ? "Required"
              : "Not Required"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                  <Sparkles className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-950">
                    AI Decision Analysis
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Explainable recommendation generated by ReturnIQ.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Recommendation
                </p>

                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {formatLabel(returnItem.recommendation)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Recommendation Reason
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {returnItem.recommendation_reason}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Automatic Rejection
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {returnItem.automatic_rejection_allowed
                      ? "Allowed"
                      : "Not allowed"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Review Requirement
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {returnItem.human_review_required
                      ? "Manual review required"
                      : "Automatic processing available"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="font-semibold text-slate-950">
                Risk Factors
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Factors contributing to the assessment.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {returnItem.factors.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">
                  No risk factors were recorded.
                </div>
              ) : (
                returnItem.factors.map((factor, index) => (
                  <div
                    key={`${factor.name}-${index}`}
                    className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {formatLabel(factor.name)}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {factor.explanation}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {factor.impact > 0 ? "+" : ""}
                      {factor.impact} points
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-blue-600" />

                <h2 className="font-semibold text-slate-950">
                  Financial Impact
                </h2>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Refund amount
                </span>

                <span className="font-semibold text-slate-900">
                  {formatCurrency(
                    returnItem.financial_impact.refund_amount,
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Estimated loss
                </span>

                <span className="font-semibold text-red-600">
                  {formatCurrency(
                    returnItem.financial_impact.estimated_loss,
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Operational cost
                </span>

                <span className="font-semibold text-slate-900">
                  {formatCurrency(
                    returnItem.financial_impact.operational_cost,
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-sm font-medium text-slate-700">
                  Recoverable value
                </span>

                <span className="font-semibold text-green-600">
                  {formatCurrency(
                    returnItem.financial_impact.recoverable_value,
                  )}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="font-semibold text-slate-950">
                Evidence
              </h2>
            </div>

            <div className="p-5">
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <Package className="mx-auto h-10 w-10 text-slate-300" />

                <p className="mt-3 text-sm font-medium text-slate-700">
                  Evidence viewer
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Uploaded product images will appear here after
                  the evidence module is connected.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="font-semibold text-slate-950">
                Decision Timeline
              </h2>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex gap-3">
                <div className="mt-1 h-3 w-3 rounded-full bg-blue-600" />

                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Return submitted
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    The return request was received.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-1 h-3 w-3 rounded-full bg-green-500" />

                <div>
                  <p className="text-sm font-medium text-slate-900">
                    AI assessment completed
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Risk and financial impact were calculated.
                  </p>
                </div>
              </div>

              {returnItem.human_review_required && (
                <div className="flex gap-3">
                  <div className="mt-1 h-3 w-3 rounded-full bg-amber-500" />

                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Awaiting human review
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      An analyst decision is required.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default ReturnDetailsPage