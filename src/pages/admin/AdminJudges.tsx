import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Game, JudgeAssignment, Profile } from '../../types/db'
import { cardClass, inputClass, primaryButtonClass } from '../../lib/ui'

export function AdminJudges() {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const judgesQuery = useQuery({
    queryKey: ['admin', 'judges'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'judge').order('full_name')
      if (error) throw error
      return data as Profile[]
    },
  })

  const gamesQuery = useQuery({
    queryKey: ['admin', 'games'],
    queryFn: async () => {
      const { data, error } = await supabase.from('games').select('*').order('name')
      if (error) throw error
      return data as Game[]
    },
  })

  const assignmentsQuery = useQuery({
    queryKey: ['admin', 'judge_assignments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('judge_assignments').select('*')
      if (error) throw error
      return data as JudgeAssignment[]
    },
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'judges'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'judge_assignments'] })
  }

  async function addJudge() {
    setError(null)
    if (!email.trim()) return
    setSubmitting(true)
    try {
      const { data: userId, error: lookupError } = await supabase.rpc('get_user_id_by_email', {
        lookup_email: email.trim(),
      })
      if (lookupError) throw lookupError
      if (!userId) {
        setError('No account found for that email. Create the login in Supabase Dashboard (Authentication > Add User) first.')
        return
      }
      const { data: existing } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle()
      if (existing?.role === 'admin') {
        setError('That email belongs to an existing Admin account. Refusing to downgrade it to Judge.')
        return
      }
      const { error: insertError } = await supabase
        .from('profiles')
        .upsert({ id: userId, full_name: fullName.trim() || null, role: 'judge' })
      if (insertError) throw insertError
      setEmail('')
      setFullName('')
      invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add judge.')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleAssignment(judgeId: string, gameId: string, assigned: boolean) {
    const { error } = assigned
      ? await supabase.from('judge_assignments').delete().match({ judge_profile_id: judgeId, game_id: gameId })
      : await supabase.from('judge_assignments').insert({ judge_profile_id: judgeId, game_id: gameId })
    if (error) {
      setError(error.message)
      return
    }
    setError(null)
    invalidate()
  }

  const assignments = assignmentsQuery.data ?? []

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2 text-saffron-800 dark:text-saffron-200">Judges</h1>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
        Judge logins are invite-only: create their email/password in Supabase Dashboard (Authentication &gt; Add
        User) first, then add them here to assign a role and games.
      </p>

      <div className={`${cardClass} mb-6 flex gap-2 items-center flex-wrap`}>
        <input
          placeholder="Judge email (must already have a login)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${inputClass} flex-1 min-w-[200px] py-1`}
        />
        <input
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={`${inputClass} py-1`}
        />
        <button type="button" onClick={addJudge} disabled={submitting} className={`${primaryButtonClass} py-1 text-sm`}>
          Add Judge
        </button>
      </div>
      {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>}

      <div className="flex flex-col gap-3">
        {judgesQuery.data?.map((judge) => (
          <div key={judge.id} className={cardClass}>
            <p className="font-medium mb-2 text-saffron-800 dark:text-saffron-200">{judge.full_name ?? judge.id}</p>
            <div className="flex flex-wrap gap-2">
              {gamesQuery.data?.map((game) => {
                const assigned = assignments.some((a) => a.judge_profile_id === judge.id && a.game_id === game.id)
                return (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => toggleAssignment(judge.id, game.id, assigned)}
                    className={`text-xs rounded-full px-3 py-1 border transition-colors ${
                      assigned
                        ? 'bg-saffron-600 text-white border-saffron-600'
                        : 'border-saffron-300 dark:border-saffron-800 text-saffron-800 dark:text-saffron-200 hover:bg-saffron-50 dark:hover:bg-saffron-900/40'
                    }`}
                  >
                    {game.name}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {judgesQuery.data?.length === 0 && <p className="text-stone-500 dark:text-stone-400">No judges added yet.</p>}
    </div>
  )
}
