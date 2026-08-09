import {
  Barcode,
  CheckCircle2,
  Image,
  ScanLine,
  ShieldAlert,
  Smartphone,
} from "lucide-react"

import type {
  EvidenceVerification,
  MultiImageConsistency,
} from "../../services/evidenceAIService"

interface AIVerificationDetailsProps {
  verification?: EvidenceVerification
  consistency?: MultiImageConsistency
}

function label(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

function statusClasses(
  status?: string,
) {
  if (
    status === "match" ||
    status === "consistent" ||
    status === "no_clear_damage_detected"
  ) {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
  }

  if (
    status === "mismatch" ||
    status === "inconsistent" ||
    status === "visible_damage_detected"
  ) {
    return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
  }

  return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
}

function AIVerificationDetails({
  verification,
  consistency,
}: AIVerificationDetailsProps) {
  const identifier =
    verification?.identifier_comparison

  const decoded =
    verification?.codes?.decoded ?? []

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <article className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Barcode className="h-4 w-4 text-blue-600" />
          <h3 className="font-semibold text-slate-950 dark:text-white">
            Barcode and QR
          </h3>
        </div>

        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {verification?.codes?.detected
            ? `${decoded.length} code(s) detected`
            : "No barcode or QR code detected"}
        </p>

        {decoded.map((item) => (
          <div
            key={`${item.type}-${item.value}`}
            className="mt-2 rounded-lg bg-slate-50 p-2 text-xs dark:bg-slate-950"
          >
            <span className="font-semibold">
              {item.type}:
            </span>{" "}
            {item.value}
          </div>
        ))}
      </article>

      <article className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-purple-600" />
          <h3 className="font-semibold text-slate-950 dark:text-white">
            Identifier verification
          </h3>
        </div>

        <span
          className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusClasses(
            identifier?.overall_status,
          )}`}
        >
          {label(
            identifier?.overall_status ??
              "not_available",
          )}
        </span>

        <div className="mt-3 space-y-2 text-xs">
          {Object.entries(
            identifier?.comparisons ?? {},
          ).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-2 dark:bg-slate-950"
            >
              <span>{label(key)}</span>
              <span className="font-semibold">
                {label(
                  value.status ??
                    "not_available",
                )}
              </span>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Image className="h-4 w-4 text-emerald-600" />
          <h3 className="font-semibold text-slate-950 dark:text-white">
            Image quality
          </h3>
        </div>

        <p className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">
          {verification?.quality
            ?.quality_score ?? 0}
          /100
        </p>

        <p className="mt-2 text-xs text-slate-500">
          {verification?.quality?.width ?? 0}
          ×
          {verification?.quality?.height ?? 0}
        </p>

        {(verification?.quality?.issues ??
          []).map((issue) => (
          <span
            key={issue}
            className="mr-2 mt-2 inline-flex rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
          >
            {label(issue)}
          </span>
        ))}
      </article>

      <article className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {verification?.damage
            ?.damage_detected ? (
            <ShieldAlert className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          )}
          <h3 className="font-semibold text-slate-950 dark:text-white">
            Damage screening
          </h3>
        </div>

        <span
          className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusClasses(
            verification?.damage?.status,
          )}`}
        >
          {label(
            verification?.damage?.status ??
              "not_available",
          )}
        </span>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          {verification?.damage?.note ??
            "No damage screening result."}
        </p>
      </article>

      {consistency && (
        <article className="rounded-xl border border-slate-200 p-4 md:col-span-2 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold text-slate-950 dark:text-white">
              Multi-image consistency
            </h3>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${statusClasses(
                consistency.status,
              )}`}
            >
              {label(consistency.status)}
            </span>

            <span className="text-sm text-slate-500">
              Agreement{" "}
              {Math.round(
                consistency.agreement_ratio *
                  100,
              )}
              %
            </span>

            {consistency.dominant_label && (
              <span className="text-sm text-slate-500">
                Dominant label:{" "}
                {consistency.dominant_label}
              </span>
            )}
          </div>
        </article>
      )}
    </div>
  )
}

export default AIVerificationDetails
