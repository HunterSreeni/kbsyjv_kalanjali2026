import { Link, Outlet } from 'react-router-dom'
import { Logo } from './Logo'
// import { ThemeToggle } from './ThemeToggle' // disabled while light mode is off
import { pageBgClass } from '../lib/ui'

export function PublicLayout() {
  return (
    <div className={`flex flex-col ${pageBgClass}`}>
      <header className="border-b border-saffron-200 dark:border-saffron-900 bg-white dark:bg-stone-900">
        <nav className="max-w-5xl mx-auto flex items-center justify-between p-4 gap-4">
          <Link to="/" className="flex items-center gap-3 font-semibold text-lg text-saffron-800 dark:text-saffron-200">
            <Logo size={40} />
            Kalanjali 2026
          </Link>
          <div className="flex items-center gap-4 text-sm text-stone-700 dark:text-stone-300">
            <Link className="hover:text-saffron-700 dark:hover:text-saffron-300" to="/games">
              Games
            </Link>
            <Link className="hover:text-saffron-700 dark:hover:text-saffron-300" to="/register">
              Register
            </Link>
            <Link className="hover:text-saffron-700 dark:hover:text-saffron-300" to="/leaderboard">
              Leaderboard
            </Link>
            <Link className="hover:text-saffron-700 dark:hover:text-saffron-300" to="/login">
              Admin / Judge
            </Link>
            {/* <ThemeToggle /> disabled while light mode is off */}
          </div>
        </nav>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}
