import { useMemo, useState } from "react"
import {
  Download,
  History,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react"

import { useReviewHistory } from "../hooks/useReviewHistory"
import { downloadReport } from "../services/analyticsService"
import { useToast } from "../contexts/ToastContext"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

function ReviewHistoryPage() {
  const { showToast } = useToast()
  const [returnIdInput, setReturnIdInput] =
    useState("")
  const [returnId, setReturnId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const filters = useMemo(
    () => ({
      returnId,
      startDate,
      endDate,
    }),
    [returnId, startDate, endDate],
  )

  const {
    data: history = [],
    isLoading,
    isFetching,
    refetch,
  } = useReviewHistory(filters)

  const exportCsv = async () => {
    try {
      await downloadReport(
        "/reports/reviews.csv",
        "returniq-review-history.csv",
        {
          return_id: returnId || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      )
      showToast("Review history downloaded.", "success")
    } catch {
      showToast("Unable to download history.", "error")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white">
            Review History
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Permanent audit trail of reviewer actions and AI overrides.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
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
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setReturnId(returnIdInput.trim())
          }}
          className="flex gap-2 md:col-span-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={returnIdInput}
              onChange={(event) =>
                setReturnIdInput(event.target.value)
              }
              placeholder="Filter by return ID"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
          <button className="rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white dark:bg-blue-600">
            Search
          </button>
        </form>

        <input
          type="date"
          value={startDate}
          onChange={(event) =>
            setStartDate(event.target.value)
          }
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />

        <input
          type="date"
          value={endDate}
          onChange={(event) =>
            setEndDate(event.target.value)
          }
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="flex min-h-96 items-center justify-center">
            <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex min-h-96 flex-col items-center justify-center text-center">
            <History className="h-12 w-12 text-slate-300" />
            <h2 className="mt-4 font-bold text-slate-800 dark:text-slate-200">
              No review history found
            </h2>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {history.map((item) => (
              <article
                key={item.id}
                className="p-5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-bold text-slate-950 dark:text-white">
                      {item.reviewer.full_name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Return {item.return_id}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {formatDate(item.created_at)}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {formatLabel(item.previous_status)}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    {formatLabel(item.new_status)}
                  </span>
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                    {formatLabel(item.action)}
                  </span>
                </div>

                {item.remarks && (
                  <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    {item.remarks}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default ReviewHistoryPage
