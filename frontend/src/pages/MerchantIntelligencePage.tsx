import {
  AlertTriangle,
  Banknote,
  RefreshCw,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react"
import { useMerchantIntelligence } from "../hooks/useMerchantIntelligence"
import AIAnalyticsStrip from "../components/analytics/AIAnalyticsStrip"

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(value)
}

function MerchantIntelligencePage() {
  const { data, isLoading, isError, refetch, isFetching } = useMerchantIntelligence()

  if (isLoading) return <div className="rounded-2xl border bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">Loading merchant intelligence...</div>
  if (isError || !data) return <div className="rounded-2xl border border-red-200 bg-white p-10 text-center dark:border-red-900 dark:bg-slate-900"><AlertTriangle className="mx-auto h-10 w-10 text-red-500"/><p className="mt-3 font-semibold">Merchant intelligence could not be loaded.</p><button onClick={() => refetch()} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-white">Retry</button></div>

  const { kpis } = data
  const metrics = [
    ["Estimated savings", money(kpis.estimated_savings), Banknote],
    ["Refund exposure", money(kpis.refund_exposure), ShieldCheck],
    ["Resolution rate", `${kpis.resolution_rate.toFixed(1)}%`, Target],
    ["Active reviews", kpis.active_reviews.toLocaleString(), Users],
  ] as const

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-blue-600">Live merchant decision intelligence</p><h1 className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">Merchant Intelligence</h1><p className="mt-2 text-slate-500 dark:text-slate-400">Savings, fraud-risk concentration, product insights and active policy rules.</p></div><button onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900"><RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}/>Refresh</button></div>
    <AIAnalyticsStrip />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([title,value,Icon]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500 dark:text-slate-400">{title}</p><p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{value}</p></div><div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"><Icon className="h-5 w-5"/></div></div></article>)}</section>
    <section className="grid gap-6 xl:grid-cols-2">
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="border-b p-5 dark:border-slate-800"><h2 className="font-bold dark:text-white">Top returned products</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950"><tr><th className="px-5 py-3">Product</th><th className="px-5 py-3">Returns</th><th className="px-5 py-3">High risk</th><th className="px-5 py-3">Rejected</th><th className="px-5 py-3">Exposure</th></tr></thead><tbody className="divide-y dark:divide-slate-800">{data.top_returned_products.map(p => <tr key={p.product_name}><td className="px-5 py-4 font-semibold dark:text-white">{p.product_name}</td><td className="px-5 py-4">{p.total_returns}</td><td className="px-5 py-4">{p.high_risk_returns}</td><td className="px-5 py-4">{p.rejected_returns}</td><td className="px-5 py-4">{money(p.refund_exposure)}</td></tr>)}</tbody></table></div></article>
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="border-b p-5 dark:border-slate-800"><h2 className="font-bold dark:text-white">Highest-risk customers</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950"><tr><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Returns</th><th className="px-5 py-3">Avg risk</th><th className="px-5 py-3">Rejected</th><th className="px-5 py-3">Exposure</th></tr></thead><tbody className="divide-y dark:divide-slate-800">{data.top_risky_customers.map(c => <tr key={c.customer_id}><td className="px-5 py-4 font-semibold dark:text-white">{c.customer_id}</td><td className="px-5 py-4">{c.total_returns}</td><td className="px-5 py-4">{c.average_risk_score.toFixed(1)}</td><td className="px-5 py-4">{c.rejected_returns}</td><td className="px-5 py-4">{money(c.refund_exposure)}</td></tr>)}</tbody></table></div></article>
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h2 className="font-bold text-slate-950 dark:text-white">Active merchant policy</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div><p className="text-xs uppercase text-slate-500">Human review threshold</p><p className="mt-1 text-xl font-bold dark:text-white">{data.rules.human_review_threshold}</p></div><div><p className="text-xs uppercase text-slate-500">Auto approval</p><p className="mt-1 text-xl font-bold dark:text-white">{data.rules.auto_approval_enabled ? `≤ ${data.rules.auto_approval_max_score}` : "Disabled"}</p></div><div><p className="text-xs uppercase text-slate-500">Auto rejection</p><p className="mt-1 text-xl font-bold dark:text-white">{data.rules.auto_rejection_enabled ? `≥ ${data.rules.auto_rejection_min_score}` : "Disabled"}</p></div><div><p className="text-xs uppercase text-slate-500">Evidence minimum</p><p className="mt-1 text-xl font-bold dark:text-white">{data.rules.require_evidence ? `${data.rules.evidence_minimum_images} image(s)` : "Optional"}</p></div></div></section>
  </div>
}
export default MerchantIntelligencePage
