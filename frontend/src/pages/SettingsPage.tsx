import {
  Bell,
  BrainCircuit,
  Building2,
  KeyRound,
  Moon,
  Palette,
  Save,
  Settings2,
  ShieldCheck,
  Sun,
  User,
} from "lucide-react"
import { useState } from "react"
import SettingSection from "../components/settings/SettingSection"

function SettingsPage() {
  const [profile, setProfile] = useState({
    fullName: "Admin User",
    email: "admin@returniq.ai",
    role: "Administrator",
  })

  const [organization, setOrganization] = useState({
    company: "ReturnIQ",
    industry: "E-Commerce",
    timezone: "Asia/Kolkata",
  })

  const [aiSettings, setAiSettings] = useState({
    autoApprove: true,
    requireHumanReview: true,
    fraudThreshold: 80,
    confidenceThreshold: 75,
  })

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    desktop: true,
  })

  const [appearance, setAppearance] = useState({
    theme: "light",
  })

  const [apiSettings, setApiSettings] = useState({
    apiKey: "rk_live_xxxxxxxxxxxxxxxxx",
    webhook:
      "https://example.com/webhooks/returniq",
  })

  function saveSettings() {
    alert("Settings saved successfully.")
  }

  function resetSettings() {
    location.reload()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Settings
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Configure ReturnIQ platform preferences.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={resetSettings}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            Reset
          </button>

          <button
            onClick={saveSettings}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>

      <SettingSection
        title="Profile"
        description="Manage your account."
        icon={<User className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={profile.fullName}
            onChange={(e) =>
              setProfile({
                ...profile,
                fullName: e.target.value,
              })
            }
            className="rounded-xl border p-3"
            placeholder="Full Name"
          />

          <input
            value={profile.email}
            onChange={(e) =>
              setProfile({
                ...profile,
                email: e.target.value,
              })
            }
            className="rounded-xl border p-3"
            placeholder="Email"
          />

          <input
            value={profile.role}
            onChange={(e) =>
              setProfile({
                ...profile,
                role: e.target.value,
              })
            }
            className="rounded-xl border p-3"
            placeholder="Role"
          />
        </div>
      </SettingSection>

      <SettingSection
        title="Organization"
        description="Organization preferences."
        icon={<Building2 className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={organization.company}
            onChange={(e) =>
              setOrganization({
                ...organization,
                company: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <input
            value={organization.industry}
            onChange={(e) =>
              setOrganization({
                ...organization,
                industry: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <input
            value={organization.timezone}
            onChange={(e) =>
              setOrganization({
                ...organization,
                timezone: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />
        </div>
      </SettingSection>

      <SettingSection
        title="AI Engine"
        description="Configure ReturnIQ AI."
        icon={<BrainCircuit className="h-5 w-5" />}
      >
        <div className="space-y-5">
          <label className="flex items-center justify-between">
            <span>Enable Automatic Approval</span>

            <input
              type="checkbox"
              checked={aiSettings.autoApprove}
              onChange={(e) =>
                setAiSettings({
                  ...aiSettings,
                  autoApprove: e.target.checked,
                })
              }
            />
          </label>

          <label className="flex items-center justify-between">
            <span>Require Human Review</span>

            <input
              type="checkbox"
              checked={aiSettings.requireHumanReview}
              onChange={(e) =>
                setAiSettings({
                  ...aiSettings,
                  requireHumanReview:
                    e.target.checked,
                })
              }
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-medium">
              Fraud Threshold
            </p>

            <input
              type="range"
              min="0"
              max="100"
              value={aiSettings.fraudThreshold}
              onChange={(e) =>
                setAiSettings({
                  ...aiSettings,
                  fraudThreshold: Number(
                    e.target.value,
                  ),
                })
              }
              className="w-full"
            />

            <p className="mt-1 text-sm text-slate-500">
              {aiSettings.fraudThreshold}
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">
              Confidence Threshold
            </p>

            <input
              type="range"
              min="0"
              max="100"
              value={aiSettings.confidenceThreshold}
              onChange={(e) =>
                setAiSettings({
                  ...aiSettings,
                  confidenceThreshold: Number(
                    e.target.value,
                  ),
                })
              }
              className="w-full"
            />

            <p className="mt-1 text-sm text-slate-500">
              {aiSettings.confidenceThreshold}
            </p>
          </div>
        </div>
      </SettingSection>
            <SettingSection
        title="Notifications"
        description="Choose how you receive ReturnIQ alerts."
        icon={<Bell className="h-5 w-5" />}
      >
        <div className="space-y-4">
          <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
            <div>
              <p className="font-medium text-slate-900">
                Email Notifications
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Receive alerts for high-risk returns and review requests.
              </p>
            </div>

            <input
              type="checkbox"
              checked={notifications.email}
              onChange={(event) =>
                setNotifications({
                  ...notifications,
                  email: event.target.checked,
                })
              }
              className="h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
            <div>
              <p className="font-medium text-slate-900">
                SMS Notifications
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Receive urgent alerts through SMS.
              </p>
            </div>

            <input
              type="checkbox"
              checked={notifications.sms}
              onChange={(event) =>
                setNotifications({
                  ...notifications,
                  sms: event.target.checked,
                })
              }
              className="h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
            <div>
              <p className="font-medium text-slate-900">
                Desktop Notifications
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Show real-time browser notifications.
              </p>
            </div>

            <input
              type="checkbox"
              checked={notifications.desktop}
              onChange={(event) =>
                setNotifications({
                  ...notifications,
                  desktop: event.target.checked,
                })
              }
              className="h-4 w-4"
            />
          </label>
        </div>
      </SettingSection>

      <SettingSection
        title="Security"
        description="Manage account and platform security."
        icon={<ShieldCheck className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-left transition hover:bg-slate-50"
          >
            <p className="font-medium text-slate-900">
              Change Password
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Update your account password.
            </p>
          </button>

          <button
            type="button"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-left transition hover:bg-slate-50"
          >
            <p className="font-medium text-slate-900">
              Enable Two-Factor Authentication
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Add another layer of account protection.
            </p>
          </button>

          <button
            type="button"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-left transition hover:bg-slate-50"
          >
            <p className="font-medium text-slate-900">
              View Active Sessions
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Review currently logged-in devices.
            </p>
          </button>

          <button
            type="button"
            className="rounded-xl border border-red-300 bg-white px-4 py-3 text-left transition hover:bg-red-50"
          >
            <p className="font-medium text-red-700">
              Sign Out All Devices
            </p>

            <p className="mt-1 text-sm text-red-500">
              End every active session except this one.
            </p>
          </button>
        </div>
      </SettingSection>

      <SettingSection
        title="Appearance"
        description="Customize the ReturnIQ dashboard theme."
        icon={<Palette className="h-5 w-5" />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              setAppearance({
                theme: "light",
              })
            }
            className={`rounded-2xl border p-5 text-left transition ${
              appearance.theme === "light"
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <Sun className="h-5 w-5 text-amber-500" />
              </div>

              <div>
                <p className="font-semibold text-slate-900">
                  Light Theme
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Bright dashboard appearance.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setAppearance({
                theme: "dark",
              })
            }
            className={`rounded-2xl border p-5 text-left transition ${
              appearance.theme === "dark"
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-900 p-3 shadow-sm">
                <Moon className="h-5 w-5 text-white" />
              </div>

              <div>
                <p className="font-semibold text-slate-900">
                  Dark Theme
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Reduced-light dashboard appearance.
                </p>
              </div>
            </div>
          </button>
        </div>
      </SettingSection>

      <SettingSection
        title="API Configuration"
        description="Manage API access and webhook delivery."
        icon={<KeyRound className="h-5 w-5" />}
      >
        <div className="space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              API Key
            </span>

            <input
              type="text"
              value={apiSettings.apiKey}
              onChange={(event) =>
                setApiSettings({
                  ...apiSettings,
                  apiKey: event.target.value,
                })
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Webhook URL
            </span>

            <input
              type="url"
              value={apiSettings.webhook}
              onChange={(event) =>
                setApiSettings({
                  ...apiSettings,
                  webhook: event.target.value,
                })
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Regenerate API Key
            </button>

            <button
              type="button"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Test Webhook
            </button>
          </div>
        </div>
      </SettingSection>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Settings2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Save Configuration
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Apply your profile, AI, notification, security, and API changes.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={resetSettings}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={saveSettings}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default SettingsPage