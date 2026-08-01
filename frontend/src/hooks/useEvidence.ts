import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  deleteEvidence,
  getEvidence,
  uploadEvidence,
} from "../services/evidenceService"

export const evidenceKeys = {
  all: ["evidence"] as const,

  byReturn: (returnId: string) =>
    [...evidenceKeys.all, returnId] as const,
}

export const useEvidence = (
  returnId: string,
) => {
  return useQuery({
    queryKey: evidenceKeys.byReturn(returnId),

    queryFn: () => getEvidence(returnId),

    enabled: Boolean(returnId),
  })
}

export const useUploadEvidence = (
  returnId: string,
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) =>
      uploadEvidence(returnId, file),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          evidenceKeys.byReturn(returnId),
      })
    },
  })
}

export const useDeleteEvidence = (
  returnId: string,
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (evidenceId: string) =>
      deleteEvidence(evidenceId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          evidenceKeys.byReturn(returnId),
      })
    },
  })
}