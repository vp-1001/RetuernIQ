interface RecommendationChartProps {
  approve: number
  review: number
  reject: number
}

function RecommendationChart({
  approve,
  review,
  reject,
}: RecommendationChartProps) {
  const total = approve + review + reject

  const approvePercent = total ? (approve / total) * 100 : 0
  const reviewPercent = total ? (review / total) * 100 : 0
  const rejectPercent = total ? (reject / total) * 100 : 0

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        AI Recommendations
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Distribution of ReturnIQ recommendations.
      </p>

      <div className="mt-6 space-y-5">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-green-600">
              Approve
            </span>

            <span>{approve}</span>
          </div>

          <div className="h-3 rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-green-500"
              style={{ width: `${approvePercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-amber-600">
              Human Review
            </span>

            <span>{review}</span>
          </div>

          <div className="h-3 rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-amber-500"
              style={{ width: `${reviewPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-red-600">
              Reject
            </span>

            <span>{reject}</span>
          </div>

          <div className="h-3 rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-red-500"
              style={{ width: `${rejectPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecommendationChart