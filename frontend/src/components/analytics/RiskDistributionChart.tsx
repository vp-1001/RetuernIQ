interface RiskDistributionChartProps {
  high: number
  medium: number
  low: number
}

function RiskDistributionChart({
  high,
  medium,
  low,
}: RiskDistributionChartProps) {
  const total = high + medium + low

  const highPercent = total ? (high / total) * 100 : 0
  const mediumPercent = total ? (medium / total) * 100 : 0
  const lowPercent = total ? (low / total) * 100 : 0

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Risk Distribution
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Breakdown of return requests by AI risk level.
      </p>

      <div className="mt-6 space-y-5">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-red-600">
              High Risk
            </span>

            <span>{high}</span>
          </div>

          <div className="h-3 rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-red-500"
              style={{ width: `${highPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-amber-600">
              Medium Risk
            </span>

            <span>{medium}</span>
          </div>

          <div className="h-3 rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-amber-500"
              style={{ width: `${mediumPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-green-600">
              Low Risk
            </span>

            <span>{low}</span>
          </div>

          <div className="h-3 rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-green-500"
              style={{ width: `${lowPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RiskDistributionChart