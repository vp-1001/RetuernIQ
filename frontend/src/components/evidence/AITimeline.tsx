import {
  CheckCircle2,
  Clock3,
  ShieldAlert,
} from "lucide-react"

import type { AITimelineItem } from "../../services/evidenceAIService"

interface AITimelineProps {
  items: AITimelineItem[]
}

function label(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

function AITimeline({
  items,
}: AITimelineProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-bold text-slate-950 dark:text-white">
        AI processing timeline
      </h2>

      <div className="mt-5 space-y-4">
        {items.map((item, index) => {
          const flagged = [
            "flagged",
            "mismatch",
            "inconsistent",
          ].includes(item.status)

          return (
            <div
              key={`${item.step}-${index}`}
              className="flex gap-3"
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  flagged
                    ? "bg-red-50 text-red-600 dark:bg-red-950/40"
                    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
                }`}
              >
                {flagged ? (
                  <ShieldAlert className="h-4 w-4" />
                ) : item.status ===
                  "completed" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Clock3 className="h-4 w-4" />
                )}
              </div>

              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {label(item.status)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default AITimeline
