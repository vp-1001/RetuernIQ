import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  getReviewDetail,
  getReviewQueue,
  getReviewSummary,
  submitReviewDecision,
  type ReviewFilters,
  type SubmitReviewDecisionPayload,
} from "../services/reviewService"

export const reviewKeys = {
  all: ["reviews"] as const,

  queues: () =>
    [...reviewKeys.all, "queue"] as const,

  queue: (filters: ReviewFilters) =>
    [...reviewKeys.queues(), filters] as const,

  details: () =>
    [...reviewKeys.all, "detail"] as const,

  detail: (returnId: string) =>
    [...reviewKeys.details(), returnId] as const,

  summary: () =>
    [...reviewKeys.all, "summary"] as const,
}

export const useReviewQueue = (
  filters: ReviewFilters,
) => {
  return useQuery({
    queryKey: reviewKeys.queue(filters),
    queryFn: () => getReviewQueue(filters),
    staleTime: 20_000,
    retry: 1,
  })
}

export const useReviewDetail = (
  returnId: string,
) => {
  return useQuery({
    queryKey: reviewKeys.detail(returnId),
    queryFn: () => getReviewDetail(returnId),
    enabled: Boolean(returnId),
    staleTime: 15_000,
    retry: 1,
  })
}

export const useReviewSummary = () => {
  return useQuery({
    queryKey: reviewKeys.summary(),
    queryFn: getReviewSummary,
    staleTime: 20_000,
    retry: 1,
  })
}

export const useSubmitReviewDecision = (
  returnId: string,
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      payload: SubmitReviewDecisionPayload,
    ) => submitReviewDecision(returnId, payload),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: reviewKeys.queues(),
        }),

        queryClient.invalidateQueries({
          queryKey: reviewKeys.detail(returnId),
        }),

        queryClient.invalidateQueries({
          queryKey: reviewKeys.summary(),
        }),

        queryClient.invalidateQueries({
          queryKey: ["returns"],
        }),
      ])
    },
  })
}