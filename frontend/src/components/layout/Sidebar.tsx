import {
  BarChart3,
  Boxes,
  ClipboardCheck,
  FileImage,
  LayoutDashboard,
  RotateCcw,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react"

import { NavLink } from "react-router-dom"

type SidebarProps = {
  isOpen: boolean
  onClose: () => void
}

const navigation = [
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
    name: "Human Review",
    path: "/reviews",
    icon: ClipboardCheck,
  },
  {
    name: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Integrations",
    path: "/integrations",
    icon: Boxes,
  },
]

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
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>

            <div>
              <h1 className="text-base font-semibold text-white">
                ReturnIQ
              </h1>

              <p className="text-xs text-slate-500">
                Decision Intelligence
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
            Workspace
          </p>

          {navigation.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-slate-800 p-3">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`
            }
          >
            <Settings className="h-5 w-5" />
            Settings
          </NavLink>

          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-sm font-medium text-white">
              ReturnIQ Platform
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              AI-powered return assessment for modern
              commerce operations.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar