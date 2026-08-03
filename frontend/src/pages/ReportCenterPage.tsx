import {
  Download,
  FileSpreadsheet,
  History,
  PieChart,
  ShieldAlert,
} from "lucide-react"

import { downloadReport } from "../services/analyticsService"
import { useToast } from "../contexts/ToastContext"

const reports = [
  {
    title: "All return complaints",
    description:
      "Complete operational dataset containing every return.",
    path: "/reports/returns.csv",
    filename: "returniq-all-returns.csv",
    icon: FileSpreadsheet,
  },
  {
    title: "Approved returns",
    description:
      "All returns finalized as approved.",
    path: "/reports/returns.csv?status=approved",
    filename: "returniq-approved.csv",
    icon: FileSpreadsheet,
  },
  {
    title: "Rejected returns",
    description:
      "All returns finalized as rejected.",
    path: "/reports/returns.csv?status=rejected",
    filename: "returniq-rejected.csv",
    icon: ShieldAlert,
  },
  {
    title: "Pending and review cases",
    description:
      "Pending, escalated and evidence-requested workflows.",
    path: "/reports/returns.csv?status=pending",
    filename: "returniq-pending.csv",
    icon: History,
  },
  {
    title: "Complete review history",
    description:
      "Reviewer actions, remarks and status changes.",
    path: "/reports/reviews.csv",
    filename: "returniq-review-history.csv",
    icon: History,
  },
  {
    title: "Executive analytics summary",
    description:
      "KPI summary for pitch decks and merchant reports.",
    path: "/reports/analytics-summary.csv",
    filename: "returniq-analytics-summary.csv",
    icon: PieChart,
  },
]

function ReportCenterPage() {
  const { showToast } = useToast()

  const download = async (
    path: string,
    filename: string,
  ) => {
    const [route, query] = path.split("?")
    const params = new URLSearchParams(query ?? "")
    const objectParams: Record<string, string> = {}

    params.forEach((value, key) => {
      objectParams[key] = value
    })

    try {
      await downloadReport(
        route,
        filename,
        objectParams,
      )
      showToast("Report downloaded.", "success")
    } catch {
      showToast("Report download failed.", "error")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">
          Report Center
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Export operational, financial and audit datasets.
        </p>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon
          return (
            <article
              key={report.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-lg font-bold text-slate-950 dark:text-white">
                {report.title}
              </h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {report.description}
              </p>
              <button
                type="button"
                onClick={() =>
                  download(
                    report.path,
                    report.filename,
                  )
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                Download CSV
              </button>
            </article>
          )
        })}
      </section>
    </div>
  )
}

export default ReportCenterPage
