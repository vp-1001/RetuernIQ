import {
  Boxes,
  CheckCircle2,
  Cloud,
  CreditCard,
  Database,
  ExternalLink,
  KeyRound,
  PackageCheck,
  Plug,
  RefreshCw,
  Search,
  Settings2,
  ShoppingBag,
  Store,
  Truck,
  Webhook,
  Zap,
} from "lucide-react"
import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import IntegrationCard from "../components/integrations/IntegrationCard"

type IntegrationStatus =
  | "connected"
  | "available"
  | "coming-soon"

type IntegrationCategory =
  | "all"
  | "marketplace"
  | "store"
  | "payment"
  | "logistics"
  | "developer"

interface Integration {
  id: string
  name: string
  description: string
  category: Exclude<IntegrationCategory, "all">
  status: IntegrationStatus
  icon: ReactNode
}

const integrations: Integration[] = [
  {
    id: "amazon",
    name: "Amazon",
    description:
      "Import return requests, order information, and customer history.",
    category: "marketplace",
    status: "connected",
    icon: <ShoppingBag className="h-6 w-6" />,
  },
  {
    id: "flipkart",
    name: "Flipkart",
    description:
      "Synchronize marketplace returns and product-level return data.",
    category: "marketplace",
    status: "available",
    icon: <Store className="h-6 w-6" />,
  },
  {
    id: "meesho",
    name: "Meesho",
    description:
      "Connect seller returns, refund events, and delivery information.",
    category: "marketplace",
    status: "coming-soon",
    icon: <ShoppingBag className="h-6 w-6" />,
  },
  {
    id: "shopify",
    name: "Shopify",
    description:
      "Import orders, products, customers, refunds, and return requests.",
    category: "store",
    status: "connected",
    icon: <Store className="h-6 w-6" />,
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    description:
      "Connect WooCommerce stores using REST API credentials.",
    category: "store",
    status: "available",
    icon: <Boxes className="h-6 w-6" />,
  },
  {
    id: "magento",
    name: "Magento",
    description:
      "Synchronize commerce orders and return authorization records.",
    category: "store",
    status: "coming-soon",
    icon: <Database className="h-6 w-6" />,
  },
  {
    id: "razorpay",
    name: "Razorpay",
    description:
      "Track refunds, payment failures, and settlement information.",
    category: "payment",
    status: "available",
    icon: <CreditCard className="h-6 w-6" />,
  },
  {
    id: "stripe",
    name: "Stripe",
    description:
      "Connect payment intents, refunds, disputes, and chargebacks.",
    category: "payment",
    status: "available",
    icon: <CreditCard className="h-6 w-6" />,
  },
  {
    id: "cashfree",
    name: "Cashfree Payments",
    description:
      "Synchronize payment and refund activity for return decisions.",
    category: "payment",
    status: "coming-soon",
    icon: <Zap className="h-6 w-6" />,
  },
  {
    id: "shiprocket",
    name: "Shiprocket",
    description:
      "Track reverse pickup, return shipment, and delivery status.",
    category: "logistics",
    status: "connected",
    icon: <PackageCheck className="h-6 w-6" />,
  },
  {
    id: "delhivery",
    name: "Delhivery",
    description:
      "Synchronize reverse logistics and shipment inspection updates.",
    category: "logistics",
    status: "available",
    icon: <Truck className="h-6 w-6" />,
  },
  {
    id: "bluedart",
    name: "Blue Dart",
    description:
      "Connect shipment tracking and reverse pickup events.",
    category: "logistics",
    status: "coming-soon",
    icon: <Truck className="h-6 w-6" />,
  },
  {
    id: "rest-api",
    name: "ReturnIQ REST API",
    description:
      "Submit returns and retrieve AI assessments programmatically.",
    category: "developer",
    status: "connected",
    icon: <Cloud className="h-6 w-6" />,
  },
  {
    id: "webhooks",
    name: "Webhooks",
    description:
      "Receive real-time events for return assessments and decisions.",
    category: "developer",
    status: "available",
    icon: <Webhook className="h-6 w-6" />,
  },
  {
    id: "api-keys",
    name: "API Keys",
    description:
      "Create and manage credentials for external applications.",
    category: "developer",
    status: "available",
    icon: <KeyRound className="h-6 w-6" />,
  },
]

function formatCategory(category: IntegrationCategory) {
  if (category === "all") {
    return "All"
  }

  return category.charAt(0).toUpperCase() + category.slice(1)
}

function IntegrationsPage() {
  const [category, setCategory] =
    useState<IntegrationCategory>("all")

  const [searchQuery, setSearchQuery] = useState("")

  const [connectedIds, setConnectedIds] = useState(
    () =>
      new Set(
        integrations
          .filter(
            (integration) =>
              integration.status === "connected",
          )
          .map((integration) => integration.id),
      ),
  )

  const filteredIntegrations = useMemo(() => {
    const normalizedSearch = searchQuery
      .trim()
      .toLowerCase()

    return integrations.filter((integration) => {
      const matchesCategory =
        category === "all" ||
        integration.category === category

      const matchesSearch =
        normalizedSearch.length === 0 ||
        integration.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        integration.description
          .toLowerCase()
          .includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })
  }, [category, searchQuery])

  function getStatus(
    integration: Integration,
  ): IntegrationStatus {
    if (integration.status === "coming-soon") {
      return "coming-soon"
    }

    return connectedIds.has(integration.id)
      ? "connected"
      : "available"
  }

  function connectIntegration(id: string) {
    setConnectedIds((currentIds) => {
      const nextIds = new Set(currentIds)
      nextIds.add(id)
      return nextIds
    })
  }

  const connectedCount = connectedIds.size

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            Integrations
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Connect ReturnIQ with your commerce, payment,
            logistics, and developer tools.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Sync all
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Settings2 className="h-4 w-4" />
            Manage credentials
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Connected
            </p>

            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {connectedCount}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Active platform connections
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Available
            </p>

            <Plug className="h-5 w-5 text-blue-600" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {
              integrations.filter(
                (integration) =>
                  integration.status !== "coming-soon" &&
                  !connectedIds.has(integration.id),
              ).length
            }
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Ready to be connected
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Coming Soon
            </p>

            <Zap className="h-5 w-5 text-amber-600" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {
              integrations.filter(
                (integration) =>
                  integration.status === "coming-soon",
              ).length
            }
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Planned platform connectors
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search integrations"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                "all",
                "marketplace",
                "store",
                "payment",
                "logistics",
                "developer",
              ] as IntegrationCategory[]
            ).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  category === item
                    ? "bg-blue-600 text-white"
                    : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {formatCategory(item)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {filteredIntegrations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Search className="mx-auto h-10 w-10 text-slate-300" />

          <h2 className="mt-4 font-semibold text-slate-900">
            No integrations found
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Try another search term or select a different
            category.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filteredIntegrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              name={integration.name}
              description={integration.description}
              icon={integration.icon}
              status={getStatus(integration)}
              onConnect={() =>
                connectIntegration(integration.id)
              }
            />
          ))}
        </div>
      )}

      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-white p-3 text-blue-600 shadow-sm">
              <Webhook className="h-6 w-6" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-950">
                Need a custom integration?
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Use the ReturnIQ REST API and webhooks to
                connect your internal order management,
                warehouse, or customer support system.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            View API documentation
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  )
}

export default IntegrationsPage