import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { ProfileRole } from '../types/db'

export function ProtectedRoute({ role, children }: { role: ProfileRole; children: ReactNode }) {
  const { session, profile, loading } = useAuth()

  if (loading) return <div className="p-8 text-center text-stone-500 dark:text-stone-400">Loading...</div>
  if (!session) return <Navigate to="/login" replace />
  if (!profile || profile.role !== role) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-semibold text-saffron-800 dark:text-saffron-200">Not authorized</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-2">Your account doesn't have {role} access.</p>
      </div>
    )
  }

  return <>{children}</>
}
