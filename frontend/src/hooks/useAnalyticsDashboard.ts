import { useQuery } from "@tanstack/react-query"

import {
  getAnalyticsDashboard,
  type AnalyticsFilters,
} from "../services/analyticsService"

export const analyticsKeys = {
  all: ["phase7-analytics"] as const,
  dashboard: (filters: AnalyticsFilters) =>
    [...analyticsKeys.all, "dashboard", filters] as const,
}

export const useAnalyticsDashboard = (
  filters: AnalyticsFilters,
) =>
  useQuery({
    queryKey: analyticsKeys.dashboard(filters),
    queryFn: () => getAnalyticsDashboard(filters),
    staleTime: 30_000,
    retry: 1,
  })
