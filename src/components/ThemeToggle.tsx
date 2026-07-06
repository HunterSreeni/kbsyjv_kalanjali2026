import { useTheme } from '../contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle light/dark theme"
      className="text-sm rounded-full border border-saffron-300 dark:border-saffron-800 px-3 py-1 text-saffron-800 dark:text-saffron-200 hover:bg-saffron-100 dark:hover:bg-saffron-900/40 transition-colors"
    >
      {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  )
}
