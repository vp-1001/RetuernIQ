import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react"

type ToastType = "success" | "error" | "info"

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (
    message: string,
    type?: ToastType,
  ) => void
}

const ToastContext =
  createContext<ToastContextValue | null>(null)

export function ToastProvider({
  children,
}: {
  children: ReactNode
}) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id),
    )
  }, [])

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = "info",
    ) => {
      const id = Date.now() + Math.random()

      setToasts((current) => [
        ...current,
        {
          id,
          message,
          type,
        },
      ])

      window.setTimeout(() => {
        removeToast(id)
      }, 4000)
    },
    [removeToast],
  )

  const value = useMemo(
    () => ({
      showToast,
    }),
    [showToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed right-4 top-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-3">
        {toasts.map((toast) => {
          const Icon =
            toast.type === "success"
              ? CheckCircle2
              : toast.type === "error"
                ? AlertCircle
                : Info

          const classes =
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : toast.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-blue-200 bg-blue-50 text-blue-800"

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 rounded-2xl border p-4 shadow-lg ${classes}`}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />

              <p className="flex-1 text-sm font-medium">
                {toast.message}
              </p>

              <button
                type="button"
                onClick={() =>
                  removeToast(toast.id)
                }
                className="rounded-lg p-1 hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error(
      "useToast must be used inside ToastProvider.",
    )
  }

  return context
}
