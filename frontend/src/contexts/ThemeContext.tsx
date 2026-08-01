import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type ThemeMode = "light" | "dark" | "system"

interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}

const ThemeContext =
  createContext<ThemeContextValue | null>(null)

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches
    ? "dark"
    : "light"
}

export function ThemeProvider({
  children,
}: {
  children: ReactNode
}) {
  const [theme, setThemeState] = useState<ThemeMode>(
    () =>
      (localStorage.getItem(
        "returniq_theme",
      ) as ThemeMode | null) ?? "system",
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)",
    )

    const applyTheme = () => {
      const resolvedTheme =
        theme === "system"
          ? getSystemTheme()
          : theme

      document.documentElement.classList.toggle(
        "dark",
        resolvedTheme === "dark",
      )

      document.documentElement.style.colorScheme =
        resolvedTheme
    }

    applyTheme()
    mediaQuery.addEventListener("change", applyTheme)

    return () =>
      mediaQuery.removeEventListener(
        "change",
        applyTheme,
      )
  }, [theme])

  const setTheme = (nextTheme: ThemeMode) => {
    localStorage.setItem(
      "returniq_theme",
      nextTheme,
    )
    setThemeState(nextTheme)
  }

  const value = useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme],
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider.",
    )
  }

  return context
}
