import { Upload } from "lucide-react"

interface Props {
  onSelect: (file: File) => void
  loading: boolean
  disabled?: boolean
}

function EvidenceUploadCard({
  onSelect,
  loading,
  disabled = false,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Upload className="mb-4 h-8 w-8 text-blue-600" />

      <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
        Upload Evidence
      </h2>

      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Upload invoices, product images and supporting
        documents.
      </p>

      <input
        id="evidence-upload"
        type="file"
        accept="image/*"
        disabled={disabled || loading}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]

          if (file) {
            onSelect(file)
            e.currentTarget.value = ""
          }
        }}
      />

      <label
        htmlFor="evidence-upload"
        className={`mt-5 inline-flex rounded-xl px-4 py-2 text-white ${
          disabled || loading
            ? "cursor-not-allowed bg-slate-400"
            : "cursor-pointer bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {disabled
          ? "Evidence Locked"
          : loading
            ? "Uploading..."
            : "Upload Files"}
      </label>
    </div>
  )
}

export default EvidenceUploadCard