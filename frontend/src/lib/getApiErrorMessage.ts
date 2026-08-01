export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          status?: number
          data?: {
            detail?:
              | string
              | Array<{ msg?: string }>
          }
        }
      }
    ).response

    const detail = response?.data?.detail

    if (typeof detail === "string") {
      return detail
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => item.msg)
        .filter(
          (message): message is string =>
            Boolean(message),
        )

      if (messages.length > 0) {
        return messages.join(", ")
      }
    }

    switch (response?.status) {
      case 401:
        return "Your session has expired. Please sign in again."
      case 403:
        return "You do not have permission to perform this action."
      case 404:
        return "The requested resource could not be found."
      case 500:
        return "The server encountered an error. Please try again."
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}
