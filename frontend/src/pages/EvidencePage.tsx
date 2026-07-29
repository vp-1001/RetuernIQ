import { FileImage, Upload, Eye, ShieldCheck } from "lucide-react"

function EvidencePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Evidence Management
        </h1>

        <p className="mt-2 text-slate-500">
          Upload and review product images, invoices and supporting
          documents for return verification.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <Upload className="mb-4 h-8 w-8 text-blue-600" />

          <h2 className="text-lg font-semibold">
            Upload Evidence
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Upload invoices, product images and supporting
            documents.
          </p>

          <button className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Upload Files
          </button>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <Eye className="mb-4 h-8 w-8 text-green-600" />

          <h2 className="text-lg font-semibold">
            Review Evidence
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            View uploaded images and invoices linked with return
            requests.
          </p>

          <button className="mt-5 rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700">
            View Evidence
          </button>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <ShieldCheck className="mb-4 h-8 w-8 text-purple-600" />

          <h2 className="text-lg font-semibold">
            AI Verification
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Future AI image comparison, OCR, barcode and serial
            verification module.
          </p>

          <button
            disabled
            className="mt-5 cursor-not-allowed rounded-xl bg-slate-300 px-4 py-2 text-slate-700"
          >
            Coming Soon
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <FileImage className="h-6 w-6 text-blue-600" />

          <h2 className="text-xl font-semibold">
            Uploaded Evidence
          </h2>
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-slate-300 py-12 text-center">
          <FileImage className="mx-auto h-10 w-10 text-slate-400" />

          <p className="mt-4 text-slate-500">
            No evidence uploaded yet.
          </p>
        </div>
      </div>
    </div>
  )
}

export default EvidencePage