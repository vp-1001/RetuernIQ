import type { ReactNode } from "react"

interface SettingSectionProps {
  title: string
  description?: string
  icon: ReactNode
  children: ReactNode
}

function SettingSection({
  title,
  description,
  icon,
  children,
}: SettingSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            {icon}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-sm text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {children}
      </div>
    </section>
  )
}

export default SettingSection