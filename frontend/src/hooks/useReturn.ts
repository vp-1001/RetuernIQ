import { useQuery } from "@tanstack/react-query"
import { getReturnById } from "../services/returnService"

export function useReturn(returnId: string | undefined) {
  return useQuery({
    queryKey: ["return", returnId],
    queryFn: () => getReturnById(returnId as string),
    enabled: Boolean(returnId),
    retry: 1,
  })
}