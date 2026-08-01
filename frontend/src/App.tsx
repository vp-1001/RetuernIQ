import { useState, type FormEvent } from "react"

import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom"

import AppLayout from "./components/layout/AppLayout"

import AnalyticsPage from "./pages/AnalyticsPage"
import DashboardPage from "./pages/DashboardPage"
import EvidencePage from "./pages/EvidencePage"
import HumanReviewPage from "./pages/HumanReviewPage"
import IntegrationsPage from "./pages/IntegrationsPage"
import ReturnDetailsPage from "./pages/ReturnDetailsPage"
import ReturnsPage from "./pages/ReturnsPage"
import SettingsPage from "./pages/SettingsPage"

import {
  isAuthenticated,
  login,
} from "./services/authService"

function ProtectedRoutes() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError("")
    setIsSubmitting(true)

    try {
      await login(email.trim(), password)

      navigate("/dashboard", {
        replace: true,
      })
    } catch {
      setError(
        "Login failed. Check your email, password and backend connection.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAuthenticated()) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white">
            R
          </div>

          <h1 className="mt-5 text-2xl font-semibold text-slate-950">
            Sign in to ReturnIQ
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Access your return intelligence dashboard.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-slate-700"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route element={<ProtectedRoutes />}>
        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/returns"
            element={<ReturnsPage />}
          />

          <Route
            path="/returns/:returnId"
            element={<ReturnDetailsPage />}
          />

          <Route
            path="/evidence"
            element={<EvidencePage />}
          />

          <Route
            path="/reviews"
            element={<HumanReviewPage />}
          />

          <Route
            path="/analytics"
            element={<AnalyticsPage />}
          />

          <Route
            path="/integrations"
            element={<IntegrationsPage />}
          />

          <Route
            path="/settings"
            element={<SettingsPage />}
          />

          <Route
            path="/customers"
            element={
              <Navigate
                to="/returns"
                replace
              />
            }
          />
        </Route>
      </Route>

      <Route
        path="/"
        element={
          <Navigate
            to={
              isAuthenticated()
                ? "/dashboard"
                : "/login"
            }
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to={
              isAuthenticated()
                ? "/dashboard"
                : "/login"
            }
            replace
          />
        }
      />
    </Routes>
  )
}

export default App