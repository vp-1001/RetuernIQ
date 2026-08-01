import api from "./api"

export interface Evidence {
  id: string
  return_id: string
  return_status?: string
  editable?: boolean
  image_url?: string
  filename: string
  original_filename: string
  file_path: string
  file_size: number
  content_type: string

  image_width?: number
  image_height?: number

  brightness_score?: number
  blur_score?: number

  dominant_red?: number
  dominant_green?: number
  dominant_blue?: number

  created_at: string
}

export const getEvidence = async (
  returnId: string,
): Promise<Evidence[]> => {
  const response = await api.get(
    `/evidence/return/${returnId}`,
  )

  return response.data
}

export const uploadEvidence = async (
  returnId: string,
  file: File,
) => {
  const formData = new FormData()

  formData.append("file", file)

  const response = await api.post(
    `/evidence/${returnId}`,
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    },
  )

  return response.data
}

export const deleteEvidence = async (
  evidenceId: string,
) => {
  const response = await api.delete(
    `/evidence/${evidenceId}`,
  )

  return response.data
}