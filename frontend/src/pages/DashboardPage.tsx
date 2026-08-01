import {
  AlertTriangle,
  IndianRupee,
  RotateCcw,
  ShieldAlert,
  TimerReset,
  X,
} from "lucide-react"
import { useState, type FormEvent } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

import { useReturns } from "../hooks/useReturns"
import { createReturn } from "../services/returnService"
import type {
  CreateReturnPayload,
  ProductCategory,
  ReturnAssessment,
  ReturnRequest,
} from "../types/return"

interface ReturnFormData {
  merchant_id: string
  external_return_id: string
  order_id: string
  customer_id: string
  product_name: string
  product_category: string
  product_price: string
  return_reason: string
  days_after_delivery: string

  missing_accessories: boolean
  duplicate_image_detected: boolean
  image_mismatch_detected: boolean

  total_orders: string
  total_returns: string
  account_age_days: string
  repeated_damage_claims: string

  refund_amount: string
  reverse_shipping_cost: string
  inspection_cost: string
  repair_cost: string
  disposal_cost: string
  recoverable_resale_value: string
}

const initialFormData: ReturnFormData = {
  merchant_id: "",
  external_return_id: "",
  order_id: "",
  customer_id: "",
  product_name: "",
  product_category: "electronics",
  product_price: "",
  return_reason: "",
  days_after_delivery: "",

  missing_accessories: false,
  duplicate_image_detected: false,
  image_mismatch_detected: false,

  total_orders: "",
  total_returns: "",
  account_age_days: "",
  repeated_damage_claims: "",

  refund_amount: "",
  reverse_shipping_cost: "",
  inspection_cost: "",
  repair_cost: "",
  disposal_cost: "",
  recoverable_resale_value: "",
}

function getRiskLevel(riskScore: number) {
  if (riskScore < 40) {
    return "Low"
  }

  if (riskScore < 70) {
    return "Medium"
  }

  return "High"
}

function getRiskClasses(level: string) {
  const normalizedLevel = level.toLowerCase()

  if (normalizedLevel === "low") {
    return "bg-emerald-50 text-emerald-700"
  }

  if (normalizedLevel === "medium") {
    return "bg-amber-50 text-amber-700"
  }

  return "bg-red-50 text-red-700"
}

function getReturnStatus(returnRequest: ReturnRequest) {
  if (returnRequest.human_review_required) {
    return "Pending Review"
  }

  if (
    returnRequest.recommendation === "manual_inspection"
  ) {
    return "Rejected"
  }

  if (
    returnRequest.recommendation === "approve_refund" ||
    returnRequest.recommendation === "instant_refund"
  ) {
    return "Approved"
  }

  return "Assessed"
}

function getStatusClasses(status: string) {
  if (status === "Approved") {
    return "bg-emerald-50 text-emerald-700"
  }

  if (status === "Rejected") {
    return "bg-red-50 text-red-700"
  }

  if (status === "Pending Review") {
    return "bg-amber-50 text-amber-700"
  }

  return "bg-blue-50 text-blue-700"
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatRecommendation(value: string) {
  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ")
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            detail?: string | Array<{ msg?: string }>
          }
        }
      }
    ).response

    const detail = response?.data?.detail

    if (typeof detail === "string") {
      return detail
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => item.msg)
        .filter(
          (message): message is string =>
            Boolean(message),
        )

      if (messages.length > 0) {
        return messages.join(", ")
      }
    }
  }

  return "Unable to create the return request. Check all fields and try again."
}

function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] =
    useState(false)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [submitError, setSubmitError] =
    useState("")

  const [latestAssessment, setLatestAssessment] =
    useState<ReturnAssessment | null>(null)

  const [formData, setFormData] =
    useState<ReturnFormData>(initialFormData)

  const {
    data: returns = [],
    isLoading,
    isError,
    refetch,
  } = useReturns()

  const updateField = (
    field: keyof ReturnFormData,
    value: string | boolean,
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const openModal = () => {
    setSubmitError("")
    setLatestAssessment(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (isSubmitting) {
      return
    }

    setIsModalOpen(false)
    setSubmitError("")
    setLatestAssessment(null)
    setFormData(initialFormData)
  }

  const buildCreatePayload =
    (): CreateReturnPayload => ({
      merchant_id: formData.merchant_id.trim(),
      external_return_id:
        formData.external_return_id.trim(),
      order_id: formData.order_id.trim(),
      customer_id: formData.customer_id.trim(),
      product_name: formData.product_name.trim(),
      product_category:
        formData.product_category.trim() as ProductCategory,
      product_price: Number(
        formData.product_price,
      ),
      return_reason: formData.return_reason.trim(),
      days_after_delivery: Number(
        formData.days_after_delivery,
      ),

      missing_accessories:
        formData.missing_accessories,
      duplicate_image_detected:
        formData.duplicate_image_detected,
      image_mismatch_detected:
        formData.image_mismatch_detected,

      customer_history: {
        total_orders: Number(
          formData.total_orders,
        ),
        total_returns: Number(
          formData.total_returns,
        ),
        account_age_days: Number(
          formData.account_age_days,
        ),
        repeated_damage_claims: Number(
          formData.repeated_damage_claims,
        ),
      },

      financial_data: {
        refund_amount: Number(
          formData.refund_amount,
        ),
        reverse_shipping_cost: Number(
          formData.reverse_shipping_cost,
        ),
        inspection_cost: Number(
          formData.inspection_cost,
        ),
        repair_cost: Number(
          formData.repair_cost,
        ),
        disposal_cost: Number(
          formData.disposal_cost,
        ),
        recoverable_resale_value: Number(
          formData.recoverable_resale_value,
        ),
      },
    })

  const handleCreateReturn = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setIsSubmitting(true)
    setSubmitError("")
    setLatestAssessment(null)

    try {
      const payload = buildCreatePayload()

      const assessment =
        await createReturn(payload)

      setLatestAssessment(assessment)

      await queryClient.invalidateQueries({
        queryKey: ["returns"],
      })

      await refetch()
    } catch (error: unknown) {
      setSubmitError(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }
    if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <h2 className="mt-4 text-lg font-semibold text-slate-800">
            Loading ReturnIQ Dashboard...
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Fetching return intelligence from the backend.
          </p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />

          <h2 className="mt-4 text-xl font-semibold text-slate-900">
            Failed to load dashboard
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Make sure the FastAPI backend is running and your
            session is still active.
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const pendingReview = returns.filter(
    (returnRequest) =>
      returnRequest.human_review_required,
  ).length

  const highRiskCases = returns.filter(
    (returnRequest) =>
      returnRequest.risk_score >= 70 ||
      returnRequest.risk_level?.toLowerCase() ===
        "high",
  ).length

  const refundExposure = returns
    .filter(
      (returnRequest) =>
        returnRequest.human_review_required,
    )
    .reduce(
      (total, returnRequest) =>
        total +
        Number(
          returnRequest.financial_impact
            ?.refund_amount ??
            0,
        ),
      0,
    )

  const metrics = [
    {
      title: "Total Returns",
      value: returns.length.toLocaleString(),
      description:
        "Return requests assessed by the platform",
      icon: RotateCcw,
      iconClasses: "bg-blue-50 text-blue-600",
    },
    {
      title: "Pending Review",
      value: pendingReview.toLocaleString(),
      description:
        "Cases requiring human review",
      icon: TimerReset,
      iconClasses: "bg-amber-50 text-amber-600",
    },
    {
      title: "High-Risk Cases",
      value: highRiskCases.toLocaleString(),
      description:
        "Cases identified as high risk",
      icon: ShieldAlert,
      iconClasses: "bg-red-50 text-red-600",
    },
    {
      title: "Refund Exposure",
      value: formatCurrency(refundExposure),
      description:
        "Potential refund amount currently under review",
      icon: IndianRupee,
      iconClasses:
        "bg-emerald-50 text-emerald-600",
    },
  ]

  const recentReturns = [...returns]
    .reverse()
    .slice(0, 5)

  const attentionQueue = returns
    .filter(
      (returnRequest) =>
        returnRequest.human_review_required ||
        returnRequest.risk_score >= 70 ||
        returnRequest.risk_level?.toLowerCase() ===
          "high",
    )
    .sort(
      (first, second) =>
        second.risk_score - first.risk_score,
    )
    .slice(0, 3)

  return (
    <>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Operations overview
            </p>

            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Return Intelligence Dashboard
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Monitor return activity, financial exposure
              and AI-generated risk decisions.
            </p>
          </div>

          <button
            type="button"
            onClick={openModal}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Create Return
          </button>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon

            return (
              <article
                key={metric.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.iconClasses}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    Live
                  </span>
                </div>

                <p className="mt-5 text-sm font-medium text-slate-500">
                  {metric.title}
                </p>

                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {metric.value}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  {metric.description}
                </p>
              </article>
            )
          })}
        </section>

        {latestAssessment && (
          <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Latest AI assessment
                </p>

                <h3 className="mt-1 text-xl font-semibold text-slate-950">
                  {formatRecommendation(
                    latestAssessment.recommendation,
                  )}
                </h3>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {
                    latestAssessment.recommendation_reason
                  }
                </p>
              </div>

              <div
                className={`w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${getRiskClasses(
                  latestAssessment.risk_level,
                )}`}
              >
                {latestAssessment.risk_level} risk ·{" "}
                {Math.round(
                  latestAssessment.risk_score,
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <AssessmentItem
                label="Confidence"
                value={`${Math.round(
                  latestAssessment.confidence <= 1
                    ? latestAssessment.confidence *
                        100
                    : latestAssessment.confidence,
                )}%`}
              />

              <AssessmentItem
                label="Human review"
                value={
                  latestAssessment.human_review_required
                    ? "Required"
                    : "Not required"
                }
              />

              <AssessmentItem
                label="Automatic rejection"
                value={
                  latestAssessment.automatic_rejection_allowed
                    ? "Allowed"
                    : "Not allowed"
                }
              />

              <AssessmentItem
                label="Estimated loss"
                value={formatCurrency(
                  latestAssessment.financial_impact
                    ?.estimated_loss ?? 0,
                )}
              />
            </div>

            {latestAssessment.factors?.length > 0 && (
              <div className="mt-5">
                <p className="text-sm font-semibold text-slate-800">
                  Risk factors
                </p>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {latestAssessment.factors.map(
                    (factor, index) => (
                      <div
                        key={`${factor.name}-${index}`}
                        className="rounded-xl border border-blue-100 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-slate-900">
                            {factor.name}
                          </p>

                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                            Impact {factor.impact}
                          </span>
                        </div>

                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {factor.explanation}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setLatestAssessment(null)
                }
                className="text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                Dismiss result
              </button>
            </div>
          </section>
        )}

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="font-semibold text-slate-950">
                  Recent Returns
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Latest return requests received by the
                  platform
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/returns")}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View all
              </button>
            </div>

            {recentReturns.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <RotateCcw className="mx-auto h-9 w-9 text-slate-300" />

                <p className="mt-3 text-sm font-medium text-slate-700">
                  No return requests found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  New return requests will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">
                        Return ID
                      </th>

                      <th className="px-5 py-3 font-medium">
                        Confidence
                      </th>

                      <th className="px-5 py-3 font-medium">
                        Refund Amount
                      </th>

                      <th className="px-5 py-3 font-medium">
                        Risk
                      </th>

                      <th className="px-5 py-3 font-medium">
                        Recommendation
                      </th>

                      <th className="px-5 py-3 font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {recentReturns.map(
                      (returnRequest, index) => {
                        const riskLevel =
                          returnRequest.risk_level ||
                          getRiskLevel(
                            returnRequest.risk_score,
                          )

                        const requestStatus =
                          getReturnStatus(
                            returnRequest,
                          )

                        const requestKey =
                          returnRequest.return_id ||
                          `return-${index}`

                        return (
                          <tr
                            key={requestKey}
                            className="hover:bg-slate-50"
                          >
                            <td className="px-5 py-4 text-sm font-medium text-slate-900">
                              <p className="max-w-[220px] truncate">
                                {returnRequest.return_id}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-700">
                              {Math.round(
                                returnRequest.confidence <= 1
                                  ? returnRequest.confidence * 100
                                  : returnRequest.confidence,
                              )}%
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-500">
                              {formatCurrency(
                                returnRequest.financial_impact
                                  ?.refund_amount ?? 0,
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${getRiskClasses(
                                  riskLevel,
                                )}`}
                              >
                                {riskLevel} ·{" "}
                                {Math.round(
                                  returnRequest.risk_score,
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {returnRequest.recommendation
                                ? formatRecommendation(
                                    returnRequest.recommendation,
                                  )
                                : "Assessment complete"}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                                  requestStatus,
                                )}`}
                              >
                                {requestStatus}
                              </span>
                            </td>
                          </tr>
                        )
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>

              <div>
                <h3 className="font-semibold text-slate-950">
                  AI Attention Queue
                </h3>

                <p className="text-sm text-slate-500">
                  Cases requiring immediate review
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {attentionQueue.length === 0 ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-900">
                    No urgent cases
                  </p>

                  <p className="mt-1 text-xs leading-5 text-emerald-700">
                    The risk engine has not detected any
                    high-risk return requests.
                  </p>
                </div>
              ) : (
                attentionQueue.map(
                  (returnRequest, index) => {
                    const requestKey =
                      returnRequest.return_id ||
                      `attention-${index}`

                    return (
                      <div
                        key={requestKey}
                        className="rounded-xl border border-red-100 bg-red-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-red-900">
                              {returnRequest.human_review_required
                                ? "Human review required"
                                : "High-risk return request"}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-red-700">
                              Return {returnRequest.return_id} has a
                              risk score of{" "}
                              {Math.round(
                                returnRequest.risk_score,
                              )}.
                            </p>

                            <p className="mt-2 text-xs leading-5 text-red-700">
                              {returnRequest.recommendation_reason}
                            </p>

                            {returnRequest.recommendation && (
                              <p className="mt-2 text-xs font-medium text-red-800">
                                Recommendation:{" "}
                                {formatRecommendation(
                                  returnRequest.recommendation,
                                )}
                              </p>
                            )}
                          </div>

                          <span className="shrink-0 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                            {Math.round(
                              returnRequest.risk_score,
                            )}
                          </span>
                        </div>
                      </div>
                    )
                  },
                )
              )}
            </div>
          </article>
        </section>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Create Return Request
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Fill in the return details to let the AI risk engine
                  assess this request.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateReturn}
              className="space-y-8 p-6"
            >
              <section>
                <h3 className="mb-4 text-lg font-semibold text-slate-900">
                  Return Information
                </h3>

                <div className="grid gap-5 md:grid-cols-2">

                  <InputField
                    label="Merchant ID"
                    value={formData.merchant_id}
                    onChange={(v) =>
                      updateField("merchant_id", v)
                    }
                    placeholder="merchant_001"
                  />

                  <InputField
                    label="External Return ID"
                    value={formData.external_return_id}
                    onChange={(v) =>
                      updateField(
                        "external_return_id",
                        v,
                      )
                    }
                    placeholder="RET-1001"
                  />

                  <InputField
                    label="Order ID"
                    value={formData.order_id}
                    onChange={(v) =>
                      updateField("order_id", v)
                    }
                    placeholder="ORD-1001"
                  />

                  <InputField
                    label="Customer ID"
                    value={formData.customer_id}
                    onChange={(v) =>
                      updateField("customer_id", v)
                    }
                    placeholder="CUS-001"
                  />

                  <InputField
                    label="Product Name"
                    value={formData.product_name}
                    onChange={(v) =>
                      updateField(
                        "product_name",
                        v,
                      )
                    }
                    placeholder="Wireless Headphones"
                  />

                  <InputField
                    label="Category"
                    value={formData.product_category}
                    onChange={(v) =>
                      updateField(
                        "product_category",
                        v,
                      )
                    }
                    placeholder="electronics"
                  />

                  <InputField
                    label="Product Price"
                    type="number"
                    value={formData.product_price}
                    onChange={(v) =>
                      updateField(
                        "product_price",
                        v,
                      )
                    }
                    placeholder="4999"
                  />

                  <InputField
                    label="Days After Delivery"
                    type="number"
                    value={
                      formData.days_after_delivery
                    }
                    onChange={(v) =>
                      updateField(
                        "days_after_delivery",
                        v,
                      )
                    }
                    placeholder="7"
                  />

                </div>

                <div className="mt-5">
                  <label className="text-sm font-medium text-slate-700">
                    Return Reason
                  </label>

                  <textarea
                    required
                    rows={4}
                    value={formData.return_reason}
                    onChange={(e) =>
                      updateField(
                        "return_reason",
                        e.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-lg font-semibold text-slate-900">
                  AI Detection Flags
                </h3>

                <div className="grid gap-4 md:grid-cols-3">

                  <CheckboxField
                    label="Missing Accessories"
                    checked={
                      formData.missing_accessories
                    }
                    onChange={(v) =>
                      updateField(
                        "missing_accessories",
                        v,
                      )
                    }
                  />

                  <CheckboxField
                    label="Duplicate Image"
                    checked={
                      formData.duplicate_image_detected
                    }
                    onChange={(v) =>
                      updateField(
                        "duplicate_image_detected",
                        v,
                      )
                    }
                  />

                  <CheckboxField
                    label="Image Mismatch"
                    checked={
                      formData.image_mismatch_detected
                    }
                    onChange={(v) =>
                      updateField(
                        "image_mismatch_detected",
                        v,
                      )
                    }
                  />

                </div>
              </section>
                            <section>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Customer History
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Provide the customer account and previous return
                    activity used by the risk engine.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <InputField
                    label="Total Orders"
                    type="number"
                    min="0"
                    value={formData.total_orders}
                    onChange={(value) =>
                      updateField("total_orders", value)
                    }
                    placeholder="25"
                  />

                  <InputField
                    label="Total Returns"
                    type="number"
                    min="0"
                    value={formData.total_returns}
                    onChange={(value) =>
                      updateField("total_returns", value)
                    }
                    placeholder="3"
                  />

                  <InputField
                    label="Account Age in Days"
                    type="number"
                    min="0"
                    value={formData.account_age_days}
                    onChange={(value) =>
                      updateField("account_age_days", value)
                    }
                    placeholder="450"
                  />

                  <InputField
                    label="Repeated Damage Claims"
                    type="number"
                    min="0"
                    value={
                      formData.repeated_damage_claims
                    }
                    onChange={(value) =>
                      updateField(
                        "repeated_damage_claims",
                        value,
                      )
                    }
                    placeholder="1"
                  />
                </div>
              </section>

              <section>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Financial Information
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Enter the expected refund, operational costs and
                    recoverable resale value.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <InputField
                    label="Refund Amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.refund_amount}
                    onChange={(value) =>
                      updateField("refund_amount", value)
                    }
                    placeholder="4999"
                  />

                  <InputField
                    label="Reverse Shipping Cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      formData.reverse_shipping_cost
                    }
                    onChange={(value) =>
                      updateField(
                        "reverse_shipping_cost",
                        value,
                      )
                    }
                    placeholder="250"
                  />

                  <InputField
                    label="Inspection Cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.inspection_cost}
                    onChange={(value) =>
                      updateField(
                        "inspection_cost",
                        value,
                      )
                    }
                    placeholder="150"
                  />

                  <InputField
                    label="Repair Cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.repair_cost}
                    onChange={(value) =>
                      updateField("repair_cost", value)
                    }
                    placeholder="500"
                  />

                  <InputField
                    label="Disposal Cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.disposal_cost}
                    onChange={(value) =>
                      updateField(
                        "disposal_cost",
                        value,
                      )
                    }
                    placeholder="100"
                  />

                  <InputField
                    label="Recoverable Resale Value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      formData.recoverable_resale_value
                    }
                    onChange={(value) =>
                      updateField(
                        "recoverable_resale_value",
                        value,
                      )
                    }
                    placeholder="2500"
                  />
                </div>
              </section>
                            {submitError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Running AI Assessment..."
                    : "Create Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {latestAssessment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">

            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  AI Risk Assessment
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Return successfully analysed.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setLatestAssessment(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">

              <AssessmentItem
                label="Risk Score"
                value={String(
                  Math.round(
                    latestAssessment.risk_score,
                  ),
                )}
              />

              <AssessmentItem
                label="Risk Level"
                value={latestAssessment.risk_level}
              />

              <AssessmentItem
                label="Confidence"
                value={`${Math.round(
                  latestAssessment.confidence <= 1
                    ? latestAssessment.confidence * 100
                    : latestAssessment.confidence,
                )}%`}
              />

              <AssessmentItem
                label="Recommendation"
                value={formatRecommendation(
                  latestAssessment.recommendation,
                )}
              />

              <AssessmentItem
                label="Human Review"
                value={
                  latestAssessment.human_review_required
                    ? "Required"
                    : "Not Required"
                }
              />

              <AssessmentItem
                label="Estimated Loss"
                value={formatCurrency(
                  latestAssessment.financial_impact
                    ?.estimated_loss ?? 0,
                )}
              />

            </div>

            {latestAssessment.factors.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-4 text-lg font-semibold">
                  Risk Factors
                </h3>

                <div className="space-y-3">
                  {latestAssessment.factors.map(
                    (factor, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">
                            {factor.name}
                          </p>

                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                            Impact {factor.impact}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-600">
                          {factor.explanation}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setLatestAssessment(null)
                }
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
          </>
  )
}

interface InputFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: "text" | "number"
  min?: string
  step?: string
  required?: boolean
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  step,
  required = true,
}: InputFieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={type}
        required={required}
        min={min}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  )
}

interface CheckboxFieldProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function CheckboxField({
  label,
  checked,
  onChange,
}: CheckboxFieldProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />

      <span className="text-sm font-medium text-slate-800">
        {label}
      </span>
    </label>
  )
}

interface AssessmentItemProps {
  label: string
  value: string
}

function AssessmentItem({
  label,
  value,
}: AssessmentItemProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  )
}

export default DashboardPage