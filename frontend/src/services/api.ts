import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios"

interface RetryableRequestConfig
  extends InternalAxiosRequestConfig {
  _retry?: boolean
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

const API_BASE_URL =
  "http://127.0.0.1:8000/api/v1"

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

let refreshPromise: Promise<string> | null = null

const clearTokens = () => {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
}

const getNewAccessToken = async (): Promise<string> => {
  const refreshToken =
    localStorage.getItem("refresh_token")

  if (!refreshToken) {
    throw new Error("Refresh token is missing.")
  }

  const response =
    await refreshClient.post<TokenResponse>(
      "/auth/refresh",
      {
        refresh_token: refreshToken,
      },
    )

  localStorage.setItem(
    "access_token",
    response.data.access_token,
  )

  localStorage.setItem(
    "refresh_token",
    response.data.refresh_token,
  )

  return response.data.access_token
}

api.interceptors.request.use((config) => {
  const accessToken =
    localStorage.getItem("access_token")

  if (accessToken) {
    config.headers.Authorization =
      `Bearer ${accessToken}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as RetryableRequestConfig | undefined

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error)
    }

    const requestUrl = originalRequest.url ?? ""

    if (
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/refresh")
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = getNewAccessToken().finally(
          () => {
            refreshPromise = null
          },
        )
      }

      const newAccessToken = await refreshPromise

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`

      return api(originalRequest)
    } catch (refreshError) {
      clearTokens()

      if (window.location.pathname !== "/login") {
        window.location.replace("/login")
      }

      return Promise.reject(refreshError)
    }
  },
)

export default api