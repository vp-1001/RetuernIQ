import api from "./api"

import type {
  CreateReturnPayload,
  ReturnAssessment,
  ReturnRequest,
} from "../types/return"

export const getReturns = async (): Promise<
  ReturnRequest[]
> => {
  const response = await api.get<ReturnRequest[]>(
    "/returns",
  )

  return response.data
}

export const getReturnById = async (
  returnId: string,
): Promise<ReturnRequest> => {
  const response = await api.get<ReturnRequest>(
    `/returns/${returnId}`,
  )

  return response.data
}

export const createReturn = async (
  data: CreateReturnPayload,
): Promise<ReturnAssessment> => {
  const response = await api.post<ReturnAssessment>(
    "/returns",
    data,
  )

  return response.data
}