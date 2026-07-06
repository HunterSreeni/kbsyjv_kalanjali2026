// Shared Tailwind class strings so the saffron theme stays consistent across
// every page instead of each file inventing its own button/input colors.

export const inputClass =
  'border border-saffron-300 dark:border-saffron-800 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-saffron-50 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-saffron-500'

export const selectClass = inputClass

export const cardClass = 'border border-saffron-200 dark:border-saffron-900 rounded-lg p-4 bg-white dark:bg-stone-900'

export const primaryButtonClass =
  'bg-saffron-600 hover:bg-saffron-700 text-white rounded px-4 py-2 disabled:opacity-50 transition-colors'

export const secondaryButtonClass =
  'border border-saffron-300 dark:border-saffron-800 text-saffron-800 dark:text-saffron-200 hover:bg-saffron-50 dark:hover:bg-saffron-900/40 rounded px-4 py-2 transition-colors'

export const dangerButtonClass =
  'border border-red-600 text-red-600 dark:text-red-400 dark:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded px-3 py-1 transition-colors'

export const successButtonClass =
  'border border-green-600 text-green-700 dark:text-green-400 dark:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/40 rounded px-3 py-1 transition-colors'

export const linkClass = 'text-saffron-700 dark:text-saffron-300 hover:text-saffron-900 dark:hover:text-saffron-100'

export const pageBgClass = 'bg-saffron-50/40 dark:bg-stone-950 text-stone-900 dark:text-saffron-50 min-h-screen'
