import { useQuery } from "@tanstack/react-query"
import { getReturns } from "../services/returnService"

export const useReturns = () => {
  return useQuery({
    queryKey: ["returns"],
    queryFn: getReturns,
    staleTime: 30_000,
    retry: 1,
  })
}