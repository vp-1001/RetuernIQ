import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  getMerchantSettings,
  resetMerchantSettings,
  updateAutomationSettings,
  updateEvidenceSettings,
  updateMerchantProfile,
  updateNotificationSettings,
  updateRiskSettings,
  type AutomationSettingsPayload,
  type EvidenceSettingsPayload,
  type MerchantProfilePayload,
  type NotificationSettingsPayload,
  type RiskSettingsPayload,
} from "../services/merchantSettingsService"

export const merchantSettingsKeys = {
  all: ["merchant-settings"] as const,
  detail: () =>
    [...merchantSettingsKeys.all, "detail"] as const,
}

export const useMerchantSettings = () =>
  useQuery({
    queryKey: merchantSettingsKeys.detail(),
    queryFn: getMerchantSettings,
    staleTime: 60_000,
    retry: 1,
  })

function useSettingsMutation<TPayload>(
  mutationFn: (payload: TPayload) => Promise<unknown>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: merchantSettingsKeys.all,
      })
    },
  })
}

export const useUpdateMerchantProfile = () =>
  useSettingsMutation<MerchantProfilePayload>(
    updateMerchantProfile,
  )

export const useUpdateRiskSettings = () =>
  useSettingsMutation<RiskSettingsPayload>(
    updateRiskSettings,
  )

export const useUpdateAutomationSettings = () =>
  useSettingsMutation<AutomationSettingsPayload>(
    updateAutomationSettings,
  )

export const useUpdateEvidenceSettings = () =>
  useSettingsMutation<EvidenceSettingsPayload>(
    updateEvidenceSettings,
  )

export const useUpdateNotificationSettings = () =>
  useSettingsMutation<NotificationSettingsPayload>(
    updateNotificationSettings,
  )

export const useResetMerchantSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resetMerchantSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: merchantSettingsKeys.all,
      })
    },
  })
}
