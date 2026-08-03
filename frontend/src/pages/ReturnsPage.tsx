import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCcw,
  Search,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useReturns } from "../hooks/useReturns"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatRecommendation(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function ReturnsPage() {
  const {
    data: returns = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useReturns()

  const [search, setSearch] = useState("")
  const [riskFilter, setRiskFilter] = useState("all")
  const [recommendationFilter, setRecommendationFilter] =
    useState("all")

  const filteredReturns = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return returns.filter((item) => {
      const payload = item.request_payload ?? {}
      const searchableValues = [
        item.return_id,
        item.status,
        item.risk_level,
        item.recommendation,
        payload.external_return_id,
        payload.order_id,
        payload.marketplace_order_id,
        payload.customer_id,
        payload.customer_name,
        payload.customer_email,
        payload.product_name,
        payload.product_category,
        payload.brand,
        payload.sku,
        payload.asin,
        payload.return_reason,
        payload.customer_comment,
      ]

      const matchesSearch =
        !normalizedSearch ||
        searchableValues.some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(normalizedSearch),
        )

      const matchesRisk =
        riskFilter === "all" ||
        item.risk_level.toLowerCase() === riskFilter

      const matchesRecommendation =
        recommendationFilter === "all" ||
        item.recommendation === recommendationFilter

      return (
        matchesSearch &&
        matchesRisk &&
        matchesRecommendation
      )
    })
  }, [
    returns,
    search,
    riskFilter,
    recommendationFilter,
  ])

  const highRiskCount = returns.filter(
    (item) => item.risk_level.toLowerCase() === "high",
  ).length

  const reviewCount = returns.filter(
    (item) => item.human_review_required,
  ).length

  const approvedCount = returns.filter(
    (item) => item.status === "approved",
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            Returns
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review, filter and manage return assessments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw
            className={`h-4 w-4 ${
              isFetching ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Total Returns
            </p>

            <RefreshCcw className="h-5 w-5 text-blue-600" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {returns.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Human Review
            </p>

            <Clock3 className="h-5 w-5 text-amber-500" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {reviewCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              High Risk
            </p>

            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {highRiskCount}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {approvedCount} finalized approvals
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search return, order, customer, product or complaint"
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <select
              value={riskFilter}
              onChange={(event) =>
                setRiskFilter(event.target.value)
              }
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">All risk levels</option>
              <option value="low">Low risk</option>
              <option value="medium">Medium risk</option>
              <option value="high">High risk</option>
            </select>

            <select
              value={recommendationFilter}
              onChange={(event) =>
                setRecommendationFilter(event.target.value)
              }
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">
                All recommendations
              </option>
              <option value="approve_refund">
                Approve refund
              </option>
              <option value="manual_review">
                Manual review
              </option>
              <option value="reject_return">
                Reject return
              </option>
            </select>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-14 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        )}

        {isError && (
          <div className="p-10 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />

            <h2 className="mt-4 text-lg font-semibold text-slate-950">
              Failed to load returns
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Check that the backend server is running and
              your login session is valid.
            </p>

            <button
              type="button"
              onClick={() => refetch()}
              className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading &&
          !isError &&
          filteredReturns.length === 0 && (
            <div className="p-12 text-center">
              <Search className="mx-auto h-10 w-10 text-slate-300" />

              <h2 className="mt-4 text-lg font-semibold text-slate-950">
                No returns found
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Change the search or filter values.
              </p>
            </div>
          )}

        {!isLoading &&
          !isError &&
          filteredReturns.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">
                      Return ID
                    </th>
                    <th className="px-5 py-4">
                      Risk Score
                    </th>
                    <th className="px-5 py-4">
                      Risk Level
                    </th>
                    <th className="px-5 py-4">
                      Recommendation
                    </th>
                    <th className="px-5 py-4">
                      Confidence
                    </th>
                    <th className="px-5 py-4">
                      Refund
                    </th>
                    <th className="px-5 py-4">
                      Human Review
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReturns.map((item) => {
                    const riskLevel =
                      item.risk_level.toLowerCase()

                    return (
                      <tr
                        key={item.return_id}
                        className="border-b border-slate-100 text-sm transition last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 font-medium text-slate-900">
                          {item.return_id}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {item.risk_score}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              riskLevel === "high"
                                ? "bg-red-100 text-red-700"
                                : riskLevel === "medium"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-green-100 text-green-700"
                            }`}
                          >
                            {item.risk_level}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {formatRecommendation(
                            item.recommendation,
                          )}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {Math.round(
                            item.confidence * 100,
                          )}
                          %
                        </td>

                        <td className="px-5 py-4 font-medium text-slate-900">
                          {formatCurrency(
                            item.financial_impact
                              .refund_amount,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {item.human_review_required ? (
                            <span className="inline-flex items-center gap-1.5 text-amber-700">
                              <Clock3 className="h-4 w-4" />
                              Required
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-green-700">
                              <CheckCircle2 className="h-4 w-4" />
                              Not required
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

        {!isLoading && !isError && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
            <p>
              Showing {filteredReturns.length} of{" "}
              {returns.length} returns
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReturnsPage