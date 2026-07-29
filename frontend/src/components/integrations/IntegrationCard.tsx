import { CheckCircle2, Clock3, Plug, XCircle } from "lucide-react"
import type { ReactNode } from "react"

interface IntegrationCardProps {
  name: string
  description: string
  icon: ReactNode
  status: "connected" | "available" | "coming-soon"
  onConnect?: () => void
}

function getStatusBadge(status: IntegrationCardProps["status"]) {
  switch (status) {
    case "connected":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Connected
        </span>
      )

    case "available":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          <Plug className="h-3.5 w-3.5" />
          Available
        </span>
      )

    case "coming-soon":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          <Clock3 className="h-3.5 w-3.5" />
          Coming Soon
        </span>
      )
  }
}

function IntegrationCard({
  name,
  description,
  icon,
  status,
  onConnect,
}: IntegrationCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
            {icon}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          </div>
        </div>

        {getStatusBadge(status)}
      </div>

      <div className="mt-6">
        {status === "available" && (
          <button
            type="button"
            onClick={onConnect}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Connect
          </button>
        )}

        {status === "connected" && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <XCircle className="h-4 w-4" />
            Disconnect
          </button>
        )}

        {status === "coming-soon" && (
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-500"
          >
            Not Available
          </button>
        )}
      </div>
    </div>
  )
}

export default IntegrationCard