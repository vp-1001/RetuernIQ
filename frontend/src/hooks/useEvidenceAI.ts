import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  analyzeEvidence,
  analyzeReturnEvidence,
  getEvidenceAIHealth,
  getAIAnalytics,
  getReturnEvidenceSummary,
} from "../services/evidenceAIService"

export const evidenceAIKeys = {
  all: ["evidence-ai"] as const,
  health: () =>
    [...evidenceAIKeys.all, "health"] as const,
  analytics: () =>
    [...evidenceAIKeys.all, "analytics"] as const,
  byReturn: (returnId: string) =>
    [
      ...evidenceAIKeys.all,
      "return",
      returnId,
    ] as const,
}

export const useEvidenceAIHealth = () =>
  useQuery({
    queryKey: evidenceAIKeys.health(),
    queryFn: getEvidenceAIHealth,
    staleTime: 60_000,
    retry: 1,
  })

export const useReturnEvidenceAI = (
  returnId: string,
) =>
  useQuery({
    queryKey:
      evidenceAIKeys.byReturn(returnId),
    queryFn: () =>
      getReturnEvidenceSummary(returnId),
    enabled: Boolean(returnId),
    retry: false,
  })

export const useAnalyzeReturnEvidence = (
  returnId: string,
) => {
  const queryClient = useQueryClient()

  return useMutation<
    Awaited<
      ReturnType<
        typeof analyzeReturnEvidence
      >
    >,
    Error,
    boolean
  >({
    mutationFn: (force) =>
      analyzeReturnEvidence(
        returnId,
        force,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          evidenceAIKeys.byReturn(returnId),
      })
    },
  })
}

export const useAnalyzeEvidence = (
  returnId: string,
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      evidenceId,
      force = false,
    }: {
      evidenceId: string
      force?: boolean
    }) =>
      analyzeEvidence(
        evidenceId,
        force,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          evidenceAIKeys.byReturn(returnId),
      })
    },
  })
}


export const useAIAnalytics = () =>
  useQuery({
    queryKey: evidenceAIKeys.analytics(),
    queryFn: getAIAnalytics,
    staleTime: 30_000,
    retry: 1,
  })
