import { useQuery } from "@tanstack/react-query"

import {
  getReviewHistory,
  type ReviewHistoryFilters,
} from "../services/reviewHistoryService"

export const reviewHistoryKeys = {
  all: ["review-history"] as const,
  list: (filters: ReviewHistoryFilters) =>
    [...reviewHistoryKeys.all, filters] as const,
}

export const useReviewHistory = (
  filters: ReviewHistoryFilters,
) =>
  useQuery({
    queryKey: reviewHistoryKeys.list(filters),
    queryFn: () => getReviewHistory(filters),
    staleTime: 30_000,
    retry: 1,
  })
