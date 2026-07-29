interface TrendPoint {
  label: string
  value: number
}

interface ReturnsTrendChartProps {
  data: TrendPoint[]
}

function ReturnsTrendChart({ data }: ReturnsTrendChartProps) {
  const maximumValue = Math.max(...data.map((item) => item.value), 1)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-950">Return Trend</h2>

          <p className="mt-1 text-sm text-slate-500">
            Return volume across the selected period.
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-72 items-center justify-center">
          <p className="text-sm text-slate-500">
            No return trend data is available.
          </p>
        </div>
      ) : (
        <div className="mt-8">
          <div className="flex h-64 items-end gap-3">
            {data.map((item) => {
              const heightPercentage =
                (item.value / maximumValue) * 100

              return (
                <div
                  key={item.label}
                  className="flex h-full flex-1 flex-col items-center justify-end"
                >
                  <span className="mb-2 text-xs font-semibold text-slate-700">
                    {item.value}
                  </span>

                  <div className="flex h-full w-full items-end justify-center">
                    <div
                      className="w-full max-w-12 rounded-t-lg bg-blue-600 transition-all duration-300 hover:bg-blue-700"
                      style={{
                        height: `${Math.max(heightPercentage, 4)}%`,
                      }}
                    />
                  </div>

                  <span className="mt-3 text-xs font-medium text-slate-500">
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ReturnsTrendChart