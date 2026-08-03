import api from "./api"

export interface ReviewHistoryItem {
  id: string
  return_id: string
  reviewer_id: string
  action: string
  previous_status: string
  new_status: string
  ai_recommendation: string
  final_decision: string
  remarks: string | null
  created_at: string
  reviewer: {
    id: string
    full_name: string
    email: string
    role: string
  }
}

export interface ReviewHistoryFilters {
  returnId?: string
  reviewerId?: string
  startDate?: string
  endDate?: string
}

export const getReviewHistory = async (
  filters: ReviewHistoryFilters = {},
): Promise<ReviewHistoryItem[]> => {
  const response = await api.get<ReviewHistoryItem[]>(
    "/reviews/history",
    {
      params: {
        return_id: filters.returnId || undefined,
        reviewer_id: filters.reviewerId || undefined,
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
      },
    },
  )

  return response.data
}
