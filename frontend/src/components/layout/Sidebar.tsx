import {
  BarChart3,
  Boxes,
  BrainCircuit,
  ClipboardCheck,
  FileClock,
  FileDown,
  FileImage,
  LayoutDashboard,
  RotateCcw,
  ScanSearch,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react"
import { NavLink } from "react-router-dom"

type SidebarProps = {
  isOpen: boolean
  onClose: () => void
}

const workspaceNavigation = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Returns",
    path: "/returns",
    icon: RotateCcw,
  },
  {
    name: "Evidence",
    path: "/evidence",
    icon: FileImage,
  },
  {
    name: "AI Evidence",
    path: "/ai-evidence",
    icon: ScanSearch,
  },
  {
    name: "Human Review",
    path: "/reviews",
    icon: ClipboardCheck,
  },
]

const intelligenceNavigation = [
  {
    name: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Merchant Intelligence",
    path: "/merchant-intelligence",
    icon: BrainCircuit,
  },
  {
    name: "Review History",
    path: "/review-history",
    icon: FileClock,
  },
  {
    name: "Report Center",
    path: "/reports",
    icon: FileDown,
  },
  {
    name: "Integrations",
    path: "/integrations",
    icon: Boxes,
  },
]

function NavigationGroup({
  title,
  items,
  onClose,
}: {
  title: string
  items: typeof workspaceNavigation
  onClose: () => void
}) {
  return (
    <div>
      <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
        {title}
      </p>

      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950/30"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0 transition group-hover:scale-105" />
              <span>{item.name}</span>
            </NavLink>
          )
        })}
      </div>
    </div>
  )
}

function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col border-r border-slate-800/80 bg-slate-950 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-950/40">
              <ShieldCheck className="h-5 w-5 text-white" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white">
                  ReturnIQ
                </h1>
                <span className="rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">
                  P7
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Decision Intelligence
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-5">
          <NavigationGroup
            title="Workspace"
            items={workspaceNavigation}
            onClose={onClose}
          />

          <NavigationGroup
            title="Intelligence"
            items={intelligenceNavigation}
            onClose={onClose}
          />
        </nav>

        <div className="border-t border-slate-800 p-3">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`
            }
          >
            <Settings className="h-5 w-5" />
            Settings
          </NavLink>

          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-4">
            <div className="flex items-center gap-2 text-blue-300">
              <Sparkles className="h-4 w-4" />
              <p className="text-xs font-bold uppercase tracking-wider">
                Merchant Intelligence
              </p>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Live risk, fraud, savings and review insights powered by ReturnIQ.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
