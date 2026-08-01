import { X } from "lucide-react"
import type { Evidence } from "../../services/evidenceService"

interface Props {
  evidence: Evidence | null
  onClose: () => void
}

function ImagePreviewModal({
  evidence,
  onClose,
}: Props) {
  if (!evidence) return null

  const normalizedPath = evidence.file_path.replace(
    /^\/?uploads\//,
    "uploads/",
  )

  const imageUrl =
    `http://127.0.0.1:8000/${normalizedPath}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="relative max-h-[90vh] max-w-5xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <X size={22} />
        </button>

        <img
          src={imageUrl}
          alt={evidence.original_filename}
          className="max-h-[70vh] rounded-xl object-contain"
        />

        <div className="mt-6 space-y-2">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
            {evidence.original_filename}
          </h2>

          <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2">
            <p>
              <strong>Size:</strong>{" "}
              {(evidence.file_size / 1024).toFixed(1)} KB
            </p>

            <p>
              <strong>Type:</strong>{" "}
              {evidence.content_type}
            </p>

            <p>
              <strong>Dimensions:</strong>{" "}
              {evidence.image_width} × {evidence.image_height}
            </p>

            <p>
              <strong>Uploaded:</strong>{" "}
              {new Date(
                evidence.created_at,
              ).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImagePreviewModal