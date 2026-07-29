import {
  AlertTriangle,
  BadgeIndianRupee,
  CheckCircle2,
  Clock3,
  Download,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  TrendingUp,
} from "lucide-react"
import { useMemo, useState } from "react"
import AnalyticsCard from "../components/analytics/AnalyticsCard"
import FinancialSummary from "../components/analytics/FinancialSummary"
import RecommendationChart from "../components/analytics/RecommendationChart"
import ReturnsTrendChart from "../components/analytics/ReturnsTrendChart"
import RiskDistributionChart from "../components/analytics/RiskDistributionChart"
import { useReturns } from "../hooks/useReturns"
import type { ReturnRequest } from "../types/return"

type RiskFilter = "all" | "high" | "medium" | "low"

type RecommendationFilter =
  | "all"
  | "approve"
  | "review"
  | "reject"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

function normalizeText(value: string | undefined) {
  return value?.trim().toLowerCase().replaceAll("_", " ") ?? ""
}

function getRecommendationGroup(
  recommendation: string,
): "approve" | "review" | "reject" {
  const value = normalizeText(recommendation)

  if (
    value.includes("reject") ||
    value.includes("deny") ||
    value.includes("decline")
  ) {
    return "reject"
  }

  if (
    value.includes("review") ||
    value.includes("inspect") ||
    value.includes("manual") ||
    value.includes("investigate")
  ) {
    return "review"
  }

  return "approve"
}

function escapeCsvValue(value: string | number | boolean) {
  const stringValue = String(value)

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`
  }

  return stringValue
}

function AnalyticsPage() {
  const {
    data: returns = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useReturns()

  const [riskFilter, setRiskFilter] =
    useState<RiskFilter>("all")

  const [recommendationFilter, setRecommendationFilter] =
    useState<RecommendationFilter>("all")

  const filteredReturns = useMemo(() => {
    return returns.filter((returnItem: ReturnRequest) => {
      const riskLevel = normalizeText(returnItem.risk_level)
      const recommendation = getRecommendationGroup(
        returnItem.recommendation,
      )

      const matchesRisk =
        riskFilter === "all" || riskLevel === riskFilter

      const matchesRecommendation =
        recommendationFilter === "all" ||
        recommendation === recommendationFilter

      return matchesRisk && matchesRecommendation
    })
  }, [returns, riskFilter, recommendationFilter])

  const analytics = useMemo(() => {
    const highRisk = filteredReturns.filter(
      (returnItem: ReturnRequest) =>
        normalizeText(returnItem.risk_level) === "high",
    ).length

    const mediumRisk = filteredReturns.filter(
      (returnItem: ReturnRequest) =>
        normalizeText(returnItem.risk_level) === "medium",
    ).length

    const lowRisk = filteredReturns.filter(
      (returnItem: ReturnRequest) =>
        normalizeText(returnItem.risk_level) === "low",
    ).length

    const approveCount = filteredReturns.filter(
      (returnItem: ReturnRequest) =>
        getRecommendationGroup(returnItem.recommendation) ===
        "approve",
    ).length

    const reviewCount = filteredReturns.filter(
      (returnItem: ReturnRequest) =>
        getRecommendationGroup(returnItem.recommendation) ===
        "review",
    ).length

    const rejectCount = filteredReturns.filter(
      (returnItem: ReturnRequest) =>
        getRecommendationGroup(returnItem.recommendation) ===
        "reject",
    ).length

    const humanReviewCount = filteredReturns.filter(
      (returnItem: ReturnRequest) =>
        returnItem.human_review_required,
    ).length

    const refundAmount = filteredReturns.reduce(
      (total: number, returnItem: ReturnRequest) =>
        total +
        (returnItem.financial_impact?.refund_amount ?? 0),
      0,
    )

    const estimatedLoss = filteredReturns.reduce(
      (total: number, returnItem: ReturnRequest) =>
        total +
        (returnItem.financial_impact?.estimated_loss ?? 0),
      0,
    )

    const operationalCost = filteredReturns.reduce(
      (total: number, returnItem: ReturnRequest) =>
        total +
        (returnItem.financial_impact?.operational_cost ?? 0),
      0,
    )

    const recoverableValue = filteredReturns.reduce(
      (total: number, returnItem: ReturnRequest) =>
        total +
        (returnItem.financial_impact?.recoverable_value ?? 0),
      0,
    )

    const averageRiskScore =
      filteredReturns.length > 0
        ? filteredReturns.reduce(
            (
              total: number,
              returnItem: ReturnRequest,
            ) => total + returnItem.risk_score,
            0,
          ) / filteredReturns.length
        : 0

    const approvalRate =
      filteredReturns.length > 0
        ? (approveCount / filteredReturns.length) * 100
        : 0

    const highRiskRate =
      filteredReturns.length > 0
        ? (highRisk / filteredReturns.length) * 100
        : 0

    return {
      highRisk,
      mediumRisk,
      lowRisk,
      approveCount,
      reviewCount,
      rejectCount,
      humanReviewCount,
      refundAmount,
      estimatedLoss,
      operationalCost,
      recoverableValue,
      averageRiskScore,
      approvalRate,
      highRiskRate,
    }
  }, [filteredReturns])

  const trendData = useMemo(() => {
    if (filteredReturns.length === 0) {
      return []
    }

    const groupCount = Math.min(7, filteredReturns.length)
    const groupSize = Math.ceil(
      filteredReturns.length / groupCount,
    )

    return Array.from({ length: groupCount }, (_, index) => {
      const start = index * groupSize
      const end = start + groupSize

      return {
        label: `B${index + 1}`,
        value: filteredReturns.slice(start, end).length,
      }
    }).filter((item) => item.value > 0)
  }, [filteredReturns])

  const topRiskFactors = useMemo(() => {
    const factorMap = new Map<
      string,
      {
        name: string
        count: number
        totalImpact: number
      }
    >()

    filteredReturns.forEach((returnItem: ReturnRequest) => {
      returnItem.factors?.forEach((factor) => {
        const key = normalizeText(factor.name)
        const existing = factorMap.get(key)

        if (existing) {
          existing.count += 1
          existing.totalImpact += factor.impact
        } else {
          factorMap.set(key, {
            name: factor.name,
            count: 1,
            totalImpact: factor.impact,
          })
        }
      })
    })

    return Array.from(factorMap.values())
      .sort((first, second) => {
        if (second.count !== first.count) {
          return second.count - first.count
        }

        return second.totalImpact - first.totalImpact
      })
      .slice(0, 5)
  }, [filteredReturns])

  function resetFilters() {
    setRiskFilter("all")
    setRecommendationFilter("all")
  }

  function exportCsv() {
    const headers = [
      "Return ID",
      "Risk Score",
      "Risk Level",
      "Confidence",
      "Recommendation",
      "Human Review Required",
      "Automatic Rejection Allowed",
      "Refund Amount",
      "Estimated Loss",
      "Operational Cost",
      "Recoverable Value",
    ]

    const rows = filteredReturns.map(
      (returnItem: ReturnRequest) => [
        returnItem.return_id,
        returnItem.risk_score,
        returnItem.risk_level,
        returnItem.confidence,
        returnItem.recommendation,
        returnItem.human_review_required,
        returnItem.automatic_rejection_allowed,
        returnItem.financial_impact?.refund_amount ?? 0,
        returnItem.financial_impact?.estimated_loss ?? 0,
        returnItem.financial_impact?.operational_cost ?? 0,
        returnItem.financial_impact?.recoverable_value ?? 0,
      ],
    )

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((value) => escapeCsvValue(value)).join(","),
      )
      .join("\n")

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    })

    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = downloadUrl
    link.download = "returniq-analytics.csv"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(downloadUrl)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-slate-200" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />

        <h1 className="mt-4 text-xl font-semibold text-slate-950">
          Analytics could not be loaded
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Make sure the ReturnIQ backend is running and try
          again.
        </p>

        <button
          type="button"
          onClick={() => refetch()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            Analytics
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor return risk, AI decisions, and financial
            impact.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isFetching ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredReturns.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Risk Level
              </span>

              <select
                value={riskFilter}
                onChange={(event) =>
                  setRiskFilter(
                    event.target.value as RiskFilter,
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All risk levels</option>
                <option value="high">High risk</option>
                <option value="medium">Medium risk</option>
                <option value="low">Low risk</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Recommendation
              </span>

              <select
                value={recommendationFilter}
                onChange={(event) =>
                  setRecommendationFilter(
                    event.target
                      .value as RecommendationFilter,
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">
                  All recommendations
                </option>
                <option value="approve">Approve</option>
                <option value="review">Human review</option>
                <option value="reject">Reject</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset filters
          </button>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Showing {filteredReturns.length} of {returns.length}{" "}
          return assessments.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard
          title="Total Returns"
          value={filteredReturns.length}
          subtitle="Assessments in the current view"
          icon={<TrendingUp className="h-5 w-5" />}
          color="bg-blue-50 text-blue-600"
        />

        <AnalyticsCard
          title="High Risk Rate"
          value={`${analytics.highRiskRate.toFixed(1)}%`}
          subtitle={`${analytics.highRisk} high-risk cases`}
          icon={<ShieldAlert className="h-5 w-5" />}
          color="bg-red-50 text-red-600"
        />

        <AnalyticsCard
          title="Approval Rate"
          value={`${analytics.approvalRate.toFixed(1)}%`}
          subtitle={`${analytics.approveCount} approvals recommended`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="bg-green-50 text-green-600"
        />

        <AnalyticsCard
          title="Refund Exposure"
          value={formatCurrency(analytics.refundAmount)}
          subtitle={`${analytics.humanReviewCount} cases need review`}
          icon={<BadgeIndianRupee className="h-5 w-5" />}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <ReturnsTrendChart data={trendData} />

        <RiskDistributionChart
          high={analytics.highRisk}
          medium={analytics.mediumRisk}
          low={analytics.lowRisk}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RecommendationChart
          approve={analytics.approveCount}
          review={analytics.reviewCount}
          reject={analytics.rejectCount}
        />

        <FinancialSummary
          estimatedLoss={analytics.estimatedLoss}
          refundAmount={analytics.refundAmount}
          operationalCost={analytics.operationalCost}
          recoverableValue={analytics.recoverableValue}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Top Risk Factors
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Most frequent factors contributing to return risk.
            </p>
          </div>

          {topRiskFactors.length === 0 ? (
            <div className="p-10 text-center">
              <ShieldAlert className="mx-auto h-10 w-10 text-slate-300" />

              <p className="mt-3 text-sm text-slate-500">
                No risk factor data is available.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topRiskFactors.map((factor, index) => (
                <div
                  key={`${factor.name}-${index}`}
                  className="flex items-center justify-between gap-4 p-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                      {index + 1}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium capitalize text-slate-900">
                        {factor.name.replaceAll("_", " ")}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Total impact:{" "}
                        {factor.totalImpact > 0 ? "+" : ""}
                        {factor.totalImpact} points
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {factor.count} cases
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Decision Intelligence
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Summary of AI assessment performance.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  Average Risk Score
                </span>

                <span className="font-semibold text-slate-900">
                  {analytics.averageRiskScore.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  Human Review Queue
                </span>

                <span className="inline-flex items-center gap-2 font-semibold text-amber-600">
                  <Clock3 className="h-4 w-4" />
                  {analytics.humanReviewCount}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  Potential Recovery
                </span>

                <span className="font-semibold text-green-600">
                  {formatCurrency(
                    analytics.recoverableValue,
                  )}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  Estimated Net Exposure
                </span>

                <span className="font-semibold text-red-600">
                  {formatCurrency(
                    Math.max(
                      analytics.estimatedLoss -
                        analytics.recoverableValue,
                      0,
                    ),
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {filteredReturns.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-slate-300" />

          <h2 className="mt-3 font-semibold text-slate-900">
            No matching analytics
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Change or reset the filters to display return data.
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <RotateCcw className="h-4 w-4" />
            Reset filters
          </button>
        </div>
      )}
    </div>
  )
}

export default AnalyticsPage