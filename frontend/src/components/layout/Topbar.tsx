import { Bell, Menu, Search } from "lucide-react"

type TopbarProps = {
  onMenuClick: () => void
}

function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex md:w-80">
          <Search className="h-4 w-4 text-slate-400" />

          <input
            type="search"
            placeholder="Search returns, customers or orders"
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <button
          type="button"
          className="flex items-center gap-3 rounded-xl p-1.5 pr-3 hover:bg-slate-50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            SA
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-slate-900">Shlok Agarwal</p>
            <p className="text-xs text-slate-500">Platform Administrator</p>
          </div>
        </button>
      </div>
    </header>
  )
}

export default Topbar