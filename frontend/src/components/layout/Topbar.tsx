import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Search,
  Settings,
  Sun,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import {
  useTheme,
  type ThemeMode,
} from "../../contexts/ThemeContext"
import { logout } from "../../services/authService"

type TopbarProps = {
  onMenuClick: () => void
}

const themeOptions: Array<{
  value: ThemeMode
  label: string
  icon: typeof Sun
}> = [
  {
    value: "light",
    label: "Light",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    icon: Monitor,
  },
]

function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  const [profileOpen, setProfileOpen] =
    useState(false)
  const [themeOpen, setThemeOpen] =
    useState(false)
  const [search, setSearch] = useState("")

  const profileRef = useRef<HTMLDivElement>(null)
  const themeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      const target = event.target as Node

      if (
        profileRef.current &&
        !profileRef.current.contains(target)
      ) {
        setProfileOpen(false)
      }

      if (
        themeRef.current &&
        !themeRef.current.contains(target)
      ) {
        setThemeOpen(false)
      }
    }

    document.addEventListener("mousedown", closeMenus)

    return () =>
      document.removeEventListener(
        "mousedown",
        closeMenus,
      )
  }, [])

  const submitSearch = () => {
    const value = search.trim()

    navigate(
      value
        ? `/returns?search=${encodeURIComponent(value)}`
        : "/returns",
    )
  }

  const handleLogout = () => {
    logout()
    navigate("/login", {
      replace: true,
    })
  }

  const activeTheme =
    themeOptions.find(
      (option) => option.value === theme,
    ) ?? themeOptions[2]

  const ActiveThemeIcon = activeTheme.icon

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 shadow-sm backdrop-blur-xl transition-colors dark:border-slate-800 dark:bg-slate-950/85 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            submitSearch()
          }}
          className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:ring-blue-950/50 md:flex md:w-80 xl:w-96"
        >
          <Search className="h-4 w-4 shrink-0 text-slate-400" />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search returns, customers or orders"
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
          />
        </form>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative" ref={themeRef}>
          <button
            type="button"
            onClick={() => {
              setThemeOpen((current) => !current)
              setProfileOpen(false)
            }}
            aria-label="Change appearance"
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ActiveThemeIcon className="h-5 w-5" />
          </button>

          {themeOpen && (
            <div className="absolute right-0 top-12 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              {themeOptions.map((option) => {
                const Icon = option.icon

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setTheme(option.value)
                      setThemeOpen(false)
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                      theme === option.value
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
        </button>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen((current) => !current)
              setThemeOpen(false)
            }}
            className="flex items-center gap-3 rounded-xl border border-transparent p-1.5 pr-2 transition hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
              SA
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Shlok Agarwal
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Platform Administrator
              </p>
            </div>

            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-14 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Shlok Agarwal
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Platform Administrator
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false)
                  navigate("/settings")
                }}
                className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Settings className="h-4 w-4" />
                Account settings
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar
