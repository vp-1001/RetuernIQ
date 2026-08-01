import type { Evidence } from "../../services/evidenceService"
import EvidenceCard from "./EvidenceCard"

interface Props {
  evidence: Evidence[]
  onDelete: (id: string) => void
  onPreview: (evidence: Evidence) => void
  editable?: boolean
}

function EvidenceGallery({
  evidence,
  onDelete,
  onPreview,
  editable = true,
}: Props) {
  if (evidence.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
        <p className="text-slate-500 dark:text-slate-400">
          No evidence uploaded yet.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {evidence.map((item) => (
        <EvidenceCard
          key={item.id}
          evidence={item}
          onDelete={onDelete}
          onPreview={onPreview}
          editable={editable && (item.editable ?? true)}
        />
      ))}
    </div>
  )
}

export default EvidenceGallery