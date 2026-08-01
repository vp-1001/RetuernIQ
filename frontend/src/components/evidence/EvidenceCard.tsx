import { Eye, Trash2 } from "lucide-react"
import type { Evidence } from "../../services/evidenceService"

interface Props {
  evidence: Evidence
  onDelete: (id: string) => void
  onPreview: (evidence: Evidence) => void
  editable?: boolean
}

function EvidenceCard({
  evidence,
  onDelete,
  onPreview,
  editable = true,
}: Props) {
  const normalizedPath = evidence.file_path.replace(
    /^\/?uploads\//,
    "uploads/",
  )

  const imageUrl =
    `http://127.0.0.1:8000/${normalizedPath}`

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => onPreview(evidence)}
        className="group relative block w-full overflow-hidden bg-slate-100 dark:bg-slate-950"
      >
        <img
          src={imageUrl}
          alt={evidence.original_filename}
          className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/45 group-hover:opacity-100">
          <Eye className="h-6 w-6" />
        </span>
      </button>

      <div className="space-y-3 p-4">
        <div>
          <h3
            className="truncate font-semibold text-slate-950 dark:text-white"
            title={evidence.original_filename}
          >
            {evidence.original_filename}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {(evidence.file_size / 1024).toFixed(1)} KB
            {evidence.image_width &&
              evidence.image_height
              ? ` · ${evidence.image_width} × ${evidence.image_height}`
              : ""}
          </p>
        </div>

        {editable ? (
          <button
            type="button"
            onClick={() => onDelete(evidence.id)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        ) : (
          <span className="inline-flex rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            View only
          </span>
        )}
      </div>
    </article>
  )
}

export default EvidenceCard
