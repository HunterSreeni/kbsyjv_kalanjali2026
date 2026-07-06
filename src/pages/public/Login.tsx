import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Logo } from '../../components/Logo'
import { inputClass, primaryButtonClass } from '../../lib/ui'

export function Login() {
  const { session, profile, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (session && profile) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/judge'} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) setError(error)
  }

  return (
    <div className="max-w-sm mx-auto mt-12">
      <div className="flex justify-center mb-4">
        <Logo size={64} />
      </div>
      <h1 className="text-xl font-semibold mb-4 text-center text-saffron-800 dark:text-saffron-200">
        Admin / Judge Login
      </h1>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-4 text-center">
        Invite-only login. Accounts are created by Admin in the Supabase Dashboard.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
