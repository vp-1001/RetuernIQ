import api from "./api"

interface LoginResponse {
  access_token: string
  token_type: string
}

export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  const formData = new URLSearchParams()

  formData.append("grant_type", "password")
  formData.append("username", email)
  formData.append("password", password)
  formData.append("scope", "")
  formData.append("client_id", "")
  formData.append("client_secret", "")

  const response = await api.post<LoginResponse>(
    "/auth/login",
    formData,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  )

  localStorage.setItem(
    "access_token",
    response.data.access_token,
  )

  return response.data
}

export const logout = () => {
  localStorage.removeItem("access_token")
}

export const isAuthenticated = () => {
  return Boolean(localStorage.getItem("access_token"))
}