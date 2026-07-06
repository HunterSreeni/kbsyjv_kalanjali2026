import { createContext, useContext, useEffect, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// Light mode is disabled for now (unreadable colors, needs a real pass) - see
// ThemeToggle usage in PublicLayout/DashboardLayout, also commented out.
// Re-enable by restoring getInitialTheme()/useState/toggleTheme below.
//
// function getInitialTheme(): Theme {
//   const stored = localStorage.getItem('theme')
//   if (stored === 'light' || stored === 'dark') return stored
//   return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
// }

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme: Theme = 'dark'

  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  function toggleTheme() {
    // no-op while light mode is disabled
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
