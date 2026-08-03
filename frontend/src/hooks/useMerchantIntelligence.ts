import { useQuery } from "@tanstack/react-query"
import { getMerchantIntelligence } from "../services/merchantIntelligenceService"

export const useMerchantIntelligence = () =>
  useQuery({
    queryKey: ["merchant-intelligence"],
    queryFn: getMerchantIntelligence,
    staleTime: 30_000,
    retry: 1,
  })
