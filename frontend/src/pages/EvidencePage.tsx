import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Eye,
  FileImage,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"

import ConfirmDialog from "../components/common/ConfirmDialog"
import EvidenceGallery from "../components/evidence/EvidenceGallery"
import EvidenceUploadCard from "../components/evidence/EvidenceUploadCard"
import ImagePreviewModal from "../components/evidence/ImagePreviewModal"

import {
  useDeleteEvidence,
  useEvidence,
  useUploadEvidence,
} from "../hooks/useEvidence"

import { useMerchantSettings } from "../hooks/useMerchantSettings"
import { useReturns } from "../hooks/useReturns"
import { useToast } from "../contexts/ToastContext"
import { getApiErrorMessage } from "../lib/getApiErrorMessage"

import type { Evidence } from "../services/evidenceService"

function formatLabel(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

function EvidencePage() {
  const [selectedReturnId, setSelectedReturnId] =
    useState("")

  const [previewEvidence, setPreviewEvidence] =
    useState<Evidence | null>(null)

  const { showToast } = useToast()

  const [deleteTarget, setDeleteTarget] =
    useState<Evidence | null>(null)

  const { data: merchantSettings } =
    useMerchantSettings()

  const {
    data: returns = [],
    isLoading: returnsLoading,
    isError: returnsError,
    error: returnsErrorDetails,
    refetch: refetchReturns,
    isFetching: returnsFetching,
  } = useReturns()

  const activeReturns = useMemo(
    () =>
      returns.filter((item) =>
        [
          "pending",
          "evidence_requested",
          "escalated",
        ].includes(item.status ?? "pending"),
      ),
    [returns],
  )

  useEffect(() => {
    if (
      selectedReturnId === "" &&
      activeReturns.length > 0
    ) {
      setSelectedReturnId(activeReturns[0].return_id)
    }
  }, [activeReturns, selectedReturnId])

  const {
    data: evidence = [],
    isLoading: evidenceLoading,
    isError: evidenceError,
    error: evidenceErrorDetails,
    refetch: refetchEvidence,
    isFetching: evidenceFetching,
  } = useEvidence(selectedReturnId)

  const uploadMutation =
    useUploadEvidence(selectedReturnId)

  const deleteMutation =
    useDeleteEvidence(selectedReturnId)

  const selectedReturn = activeReturns.find(
    (item) =>
      item.return_id === selectedReturnId,
  )

  const handleReturnChange = (
    returnId: string,
  ) => {
    setPreviewEvidence(null)
    setSelectedReturnId(returnId)
  }

  const handleUpload = async (file: File) => {
    if (!selectedReturnId || !selectedReturn) {
      showToast(
        "Select a return request before uploading evidence.",
        "error",
      )
      return
    }

    const allowedFileTypes = [
      merchantSettings?.allow_jpeg
        ? "image/jpeg"
        : null,
      merchantSettings?.allow_png
        ? "image/png"
        : null,
      merchantSettings?.allow_webp
        ? "image/webp"
        : null,
    ].filter((type): type is string => Boolean(type))

    if (!allowedFileTypes.includes(file.type)) {
      showToast(
        "This image format is disabled in Merchant Settings.",
        "error",
      )
      return
    }

    const maximumFileSize =
      (merchantSettings?.maximum_upload_size_mb ?? 10) *
      1024 *
      1024

    if (file.size > maximumFileSize) {
      showToast(
        `The selected image must be smaller than ${
          merchantSettings?.maximum_upload_size_mb ?? 10
        } MB.`,
        "error",
      )
      return
    }

    try {
      await uploadMutation.mutateAsync(file)

      showToast(
        `${file.name} uploaded successfully.`,
        "success",
      )
    } catch (error) {
      showToast(
        getApiErrorMessage(error),
        "error",
      )
    }
  }

  const handleDelete = (evidenceId: string) => {
    const evidenceItem = evidence.find(
      (item) => item.id === evidenceId,
    )

    if (evidenceItem) {
      setDeleteTarget(evidenceItem)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return
    }

    try {
      await deleteMutation.mutateAsync(
        deleteTarget.id,
      )

      if (
        previewEvidence?.id === deleteTarget.id
      ) {
        setPreviewEvidence(null)
      }

      setDeleteTarget(null)
      showToast(
        "Evidence deleted successfully.",
        "success",
      )
    } catch (error) {
      showToast(
        getApiErrorMessage(error),
        "error",
      )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Evidence Management
        </h1>

        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Review evidence received from marketplace customers. Manual upload is reserved for support agents and warehouse teams.
        </p>
      </div>


      <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full lg:max-w-xl">
            <label
              htmlFor="return-request"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Select Return for Manual Evidence Upload
            </label>

            {returnsLoading ? (
              <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading return requests...
              </div>
            ) : returnsError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">
                  {getApiErrorMessage(
                    returnsErrorDetails,
                  )}
                </p>

                <button
                  type="button"
                  onClick={() => refetchReturns()}
                  disabled={returnsFetching}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      returnsFetching
                        ? "animate-spin"
                        : ""
                    }`}
                  />

                  Retry
                </button>
              </div>
            ) : activeReturns.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                No return requests are available. Create a
                return request first.
              </div>
            ) : (
              <select
                id="return-request"
                value={selectedReturnId}
                onChange={(event) =>
                  handleReturnChange(
                    event.target.value,
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {activeReturns.map((item) => (
                  <option
                    key={item.return_id}
                    value={item.return_id}
                  >
                    {item.return_id.slice(0, 8)} —{" "}
                    {formatLabel(
                      item.recommendation,
                    )}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              refetchEvidence()
            }}
            disabled={
              !selectedReturnId ||
              evidenceFetching
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                evidenceFetching
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh Evidence
          </button>
        </div>

        {selectedReturn && (
          <div className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-950 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-slate-500 dark:text-slate-400">
                Return ID
              </p>

              <p
                className="mt-1 truncate font-semibold text-slate-900 dark:text-white"
                title={selectedReturn.return_id}
              >
                {selectedReturn.return_id}
              </p>
            </div>

            <div>
              <p className="text-slate-500 dark:text-slate-400">
                Risk Level
              </p>

              <p className="mt-1 capitalize font-semibold text-slate-900 dark:text-white">
                {selectedReturn.risk_level}
              </p>
            </div>

            <div>
              <p className="text-slate-500 dark:text-slate-400">
                Risk Score
              </p>

              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                {selectedReturn.risk_score}
              </p>
            </div>

            <div>
              <p className="text-slate-500 dark:text-slate-400">
                Review Status
              </p>

              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                {formatLabel(
                  selectedReturn.status ?? "pending",
                )}
              </p>
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <EvidenceUploadCard
          onSelect={handleUpload}
          loading={uploadMutation.isPending}
          disabled={!selectedReturnId}
        />

        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm">
          <Eye className="mb-4 h-8 w-8 text-green-600" />

          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Review Evidence
          </h2>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            View uploaded images and their metadata for
            the selected return request.
          </p>

          <div className="mt-5 rounded-xl bg-green-50 px-4 py-3">
            <p className="text-sm font-semibold text-green-700">
              {selectedReturnId
                ? `${evidence.length} file${
                    evidence.length === 1
                      ? ""
                      : "s"
                  } uploaded`
                : "Select a return request"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm">
          <ShieldCheck className="mb-4 h-8 w-8 text-purple-600" />

          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            AI Verification
          </h2>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            OCR, damage analysis, barcode and serial
            verification will be added in later phases.
          </p>

          <button
            type="button"
            disabled
            className="mt-5 cursor-not-allowed rounded-xl bg-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
          >
            Coming Soon
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <FileImage className="h-6 w-6 text-blue-600" />

            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white dark:text-white">
                Uploaded Evidence
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Click an image to open its full preview.
              </p>
            </div>
          </div>

          {selectedReturnId && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {evidence.length} total
            </span>
          )}
        </div>

        <div className="mt-6">
          {!selectedReturnId ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
              <FileImage className="mx-auto h-10 w-10 text-slate-400" />

              <p className="mt-4 text-slate-500 dark:text-slate-400">
                Select a return request to view its
                evidence.
              </p>
            </div>
          ) : evidenceLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Loading evidence...
                </p>
              </div>
            </div>
          ) : evidenceError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-600" />

              <p className="mt-3 text-sm text-red-700">
                {getApiErrorMessage(
                  evidenceErrorDetails,
                )}
              </p>

              <button
                type="button"
                onClick={() => refetchEvidence()}
                disabled={evidenceFetching}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    evidenceFetching
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Retry
              </button>
            </div>
          ) : (
            <EvidenceGallery
              evidence={evidence}
              onDelete={handleDelete}
              onPreview={setPreviewEvidence}
              editable={Boolean(selectedReturnId)}
            />
          )}
        </div>
      </section>

      <ImagePreviewModal
        evidence={previewEvidence}
        onClose={() => setPreviewEvidence(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete evidence?"
        description={`Delete ${
          deleteTarget?.original_filename ??
          "this evidence file"
        }? This action cannot be undone.`}
        confirmLabel="Delete Evidence"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {(uploadMutation.isPending ||
        deleteMutation.isPending) && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl">
          <Loader2 className="h-4 w-4 animate-spin" />

          {uploadMutation.isPending
            ? "Uploading evidence..."
            : "Deleting evidence..."}
        </div>
      )}
    </div>
  )
}

export default EvidencePage