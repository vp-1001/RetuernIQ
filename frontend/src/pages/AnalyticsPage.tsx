import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  XCircle,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { useAnalyticsDashboard } from "../hooks/useAnalyticsDashboard"
import { downloadReport } from "../services/analyticsService"
import { useToast } from "../contexts/ToastContext"
import AIAnalyticsStrip from "../components/analytics/AIAnalyticsStrip"

const palette = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#d97706",
  "#7c3aed",
  "#0891b2",
]

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

function label(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

function AnalyticsPage() {
  const { showToast } = useToast()
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const filters = useMemo(
    () => ({
      startDate,
      endDate,
    }),
    [startDate, endDate],
  )

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAnalyticsDashboard(filters)

  const exportReport = async (
    path: string,
    filename: string,
  ) => {
    try {
      await downloadReport(path, filename, {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      })
      showToast("Report downloaded.", "success")
    } catch {
      showToast("Unable to download report.", "error")
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Loading merchant intelligence...
          </p>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm dark:border-red-900 dark:bg-slate-900">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="mt-4 text-xl font-bold text-slate-950 dark:text-white">
          Analytics could not be loaded
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {error instanceof Error
            ? error.message
            : "Check the backend and try again."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    )
  }

  const { overview } = data

  const cards = [
    {
      label: "Total returns",
      value: overview.total_returns.toLocaleString(),
      icon: TrendingUp,
    },
    {
      label: "Approved",
      value: overview.approved.toLocaleString(),
      icon: CheckCircle2,
    },
    {
      label: "Rejected",
      value: overview.rejected.toLocaleString(),
      icon: XCircle,
    },
    {
      label: "High-risk cases",
      value: overview.high_risk_cases.toLocaleString(),
      icon: ShieldAlert,
    },
    {
      label: "Refund exposure",
      value: currency(overview.refund_exposure),
      icon: Banknote,
    },
    {
      label: "Estimated savings",
      value: currency(overview.estimated_savings),
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Phase 7 intelligence
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">
            Executive Analytics
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Live operational, fraud, financial and review metrics.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
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
            onClick={() =>
              exportReport(
                "/reports/analytics-summary.csv",
                "returniq-analytics-summary.csv",
              )
            }
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Export summary
          </button>
        </div>
      </div>

      <AIAnalyticsStrip />

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
        <label>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Start date
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(event) =>
              setStartDate(event.target.value)
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </label>

        <label>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            End date
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(event) =>
              setEndDate(event.target.value)
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </label>

        <button
          type="button"
          onClick={() =>
            exportReport(
              "/reports/returns.csv",
              "returniq-all-returns.csv",
            )
          }
          className="mt-auto rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Export all returns
        </button>

        <button
          type="button"
          onClick={() =>
            exportReport(
              "/reports/reviews.csv",
              "returniq-review-history.csv",
            )
          }
          className="mt-auto rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Export review history
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <article
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                    {card.value}
                  </p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-bold text-slate-950 dark:text-white">
            Return trend
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Daily return volume and resolved outcomes.
          </p>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.return_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total_returns"
                  stroke="#2563eb"
                  strokeWidth={3}
                  name="Total"
                />
                <Line
                  type="monotone"
                  dataKey="approved"
                  stroke="#16a34a"
                  strokeWidth={2}
                  name="Approved"
                />
                <Line
                  type="monotone"
                  dataKey="rejected"
                  stroke="#dc2626"
                  strokeWidth={2}
                  name="Rejected"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-bold text-slate-950 dark:text-white">
            Status distribution
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Current return workflow composition.
          </p>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.status_distribution}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={3}
                >
                  {data.status_distribution.map(
                    (_, index) => (
                      <Cell
                        key={index}
                        fill={
                          palette[index % palette.length]
                        }
                      />
                    ),
                  )}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    value,
                    label(String(name)),
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-bold text-slate-950 dark:text-white">
            Risk distribution
          </h2>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.risk_distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#2563eb"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-bold text-slate-950 dark:text-white">
            Category intelligence
          </h2>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.category_insights}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={90}
                />
                <Tooltip />
                <Bar
                  dataKey="total_returns"
                  fill="#7c3aed"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 className="font-bold text-slate-950 dark:text-white">
            Reviewer performance
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Reviewer</th>
                <th className="px-5 py-3">Returns reviewed</th>
                <th className="px-5 py-3">Review actions</th>
                <th className="px-5 py-3">Approved</th>
                <th className="px-5 py-3">Rejected</th>
                <th className="px-5 py-3">Escalated</th>
                <th className="px-5 py-3">Approval rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.reviewer_performance.map(
                (reviewer) => (
                  <tr key={reviewer.reviewer_id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {reviewer.reviewer_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {reviewer.reviewer_email}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      {reviewer.unique_returns_reviewed}
                    </td>
                    <td className="px-5 py-4">
                      {reviewer.total_decisions}
                    </td>
                    <td className="px-5 py-4">
                      {reviewer.approved}
                    </td>
                    <td className="px-5 py-4">
                      {reviewer.rejected}
                    </td>
                    <td className="px-5 py-4">
                      {reviewer.escalated}
                    </td>
                    <td className="px-5 py-4">
                      {reviewer.approval_rate.toFixed(1)}%
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default AnalyticsPage
