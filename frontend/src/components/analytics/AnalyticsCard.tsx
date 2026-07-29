import type { ReactNode } from "react"

interface AnalyticsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  color?: string
}

function AnalyticsCard({
  title,
  value,
  subtitle,
  icon,
  color = "bg-blue-50 text-blue-600",
}: AnalyticsCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </h2>

          {subtitle && (
            <p className="mt-2 text-sm text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default AnalyticsCard