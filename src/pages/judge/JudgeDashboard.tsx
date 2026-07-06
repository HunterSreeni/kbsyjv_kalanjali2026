import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Game, Registration, Score } from '../../types/db'
import { cardClass, inputClass, primaryButtonClass } from '../../lib/ui'

interface RegistrationRow extends Registration {
  games: Pick<Game, 'name'> | null
  age_categories: { name: string } | null
}

export function JudgeDashboard() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [inputs, setInputs] = useState<Record<string, { score: string; remarks: string }>>({})

  const registrationsQuery = useQuery({
    queryKey: ['judge', 'registrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, games(name), age_categories(name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as RegistrationRow[]
    },
  })

  const myScoresQuery = useQuery({
    queryKey: ['judge', 'my_scores', profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase.from('scores').select('*').eq('judge_id', profile!.id)
      if (error) throw error
      return data as Score[]
    },
  })

  useEffect(() => {
    if (!myScoresQuery.data) return
    setInputs((prev) => {
      const next = { ...prev }
      for (const s of myScoresQuery.data) {
        if (!next[s.registration_id]) {
          next[s.registration_id] = { score: String(s.score), remarks: s.remarks ?? '' }
        }
      }
      return next
    })
  }, [myScoresQuery.data])

  async function saveScore(registrationId: string) {
    if (!profile) return
    const input = inputs[registrationId]
    if (!input || input.score.trim() === '') return
    await supabase.from('scores').upsert(
      {
        registration_id: registrationId,
        judge_id: profile.id,
        score: Number(input.score),
        remarks: input.remarks || null,
      },
      { onConflict: 'registration_id,judge_id' },
    )
    queryClient.invalidateQueries({ queryKey: ['judge', 'my_scores'] })
  }

  const myScoreByRegistration = new Map((myScoresQuery.data ?? []).map((s) => [s.registration_id, s]))

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2 text-saffron-800 dark:text-saffron-200">My Assigned Registrations</h1>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
        Only confirmed registrations for your assigned games appear here.
      </p>

      {registrationsQuery.isLoading && <p>Loading...</p>}

      <div className="flex flex-col gap-3">
        {registrationsQuery.data?.map((r) => {
          const existing = myScoreByRegistration.get(r.id)
          const input = inputs[r.id] ?? { score: existing ? String(existing.score) : '', remarks: existing?.remarks ?? '' }
          return (
            <div key={r.id} className={cardClass}>
              <p className="font-medium text-saffron-800 dark:text-saffron-200">
                {r.games?.name} - {r.team_name ?? r.contact_name} ({r.age_categories?.name})
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">{r.reference_code}</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Score"
                  value={input.score}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [r.id]: { ...input, score: e.target.value } }))}
                  className={`${inputClass} w-24 py-1`}
                />
                <input
                  placeholder="Remarks (optional)"
                  value={input.remarks}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [r.id]: { ...input, remarks: e.target.value } }))}
                  className={`${inputClass} flex-1 py-1`}
                />
                <button type="button" onClick={() => saveScore(r.id)} className={`${primaryButtonClass} py-1 text-sm`}>
                  {existing ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
      {registrationsQuery.data?.length === 0 && (
        <p className="text-stone-500 dark:text-stone-400">No confirmed registrations for your assigned games yet.</p>
      )}
    </div>
  )
}
