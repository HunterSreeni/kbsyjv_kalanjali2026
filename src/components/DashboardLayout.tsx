import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'
// import { ThemeToggle } from './ThemeToggle' // disabled while light mode is off
import { pageBgClass } from '../lib/ui'

export function DashboardLayout({ links, title }: { links: { to: string; label: string }[]; title: string }) {
  const { signOut, profile } = useAuth()

  return (
    <div className={`flex flex-col ${pageBgClass}`}>
      <header className="border-b border-saffron-200 dark:border-saffron-900 bg-white dark:bg-stone-900">
        <nav className="max-w-5xl mx-auto flex items-center justify-between p-4 gap-4">
          <span className="flex items-center gap-3 font-semibold text-lg text-saffron-800 dark:text-saffron-200">
            <Logo size={36} />
            {title}
          </span>
          <div className="flex items-center gap-4 text-sm text-stone-700 dark:text-stone-300">
            {links.map((l) => (
              <Link key={l.to} className="hover:text-saffron-700 dark:hover:text-saffron-300" to={l.to}>
                {l.label}
              </Link>
            ))}
            <span className="text-stone-500 dark:text-stone-400">{profile?.full_name ?? profile?.role}</span>
            <button
              type="button"
              onClick={signOut}
              className="underline hover:text-saffron-700 dark:hover:text-saffron-300"
            >
              Sign out
            </button>
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
