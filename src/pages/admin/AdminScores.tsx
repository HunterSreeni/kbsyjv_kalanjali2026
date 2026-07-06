import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Game, Registration, Score } from '../../types/db'
import { cardClass, dangerButtonClass, inputClass, secondaryButtonClass } from '../../lib/ui'

interface RegistrationRow extends Registration {
  games: Pick<Game, 'name'> | null
  age_categories: { name: string } | null
}

interface ScoreRow extends Score {
  profiles: { full_name: string | null } | null
}

export function AdminScores() {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [scores, setScores] = useState<ScoreRow[]>([])
  const [overrideValue, setOverrideValue] = useState('')
  const [overrideNote, setOverrideNote] = useState('')

  const registrationsQuery = useQuery({
    queryKey: ['admin', 'scores', 'registrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, games(name), age_categories(name)')
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as RegistrationRow[]
    },
  })

  async function fetchScores(id: string) {
    const { data } = await supabase.from('scores').select('*, profiles(full_name)').eq('registration_id', id)
    setScores((data as unknown as ScoreRow[]) ?? [])
  }

  async function toggleExpand(registration: RegistrationRow) {
    if (expanded === registration.id) {
      setExpanded(null)
      return
    }
    await fetchScores(registration.id)
    setOverrideValue(registration.override_score !== null ? String(registration.override_score) : '')
    setOverrideNote(registration.override_note ?? '')
    setExpanded(registration.id)
  }

  async function saveOverride(registrationId: string) {
    if (overrideValue.trim() === '') return
    await supabase
      .from('registrations')
      .update({ override_score: Number(overrideValue), override_note: overrideNote.trim() || null })
      .eq('id', registrationId)
    queryClient.invalidateQueries({ queryKey: ['admin', 'scores'] })
  }

  async function clearOverride(registrationId: string) {
    await supabase
      .from('registrations')
      .update({ override_score: null, override_note: null })
      .eq('id', registrationId)
    setOverrideValue('')
    setOverrideNote('')
    queryClient.invalidateQueries({ queryKey: ['admin', 'scores'] })
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4 text-saffron-800 dark:text-saffron-200">Scores</h1>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
        Confirmed registrations only. An override score replaces the judges' average on the leaderboard entirely -
        it isn't averaged in with judge scores.
      </p>

      <div className="flex flex-col gap-2">
        {registrationsQuery.data?.map((r) => (
          <div key={r.id} className={cardClass}>
            <button type="button" onClick={() => toggleExpand(r)} className="text-left w-full">
              <p className="font-medium text-saffron-800 dark:text-saffron-200">
                {r.games?.name} - {r.team_name ?? r.contact_name} ({r.age_categories?.name})
                {r.override_score !== null && (
                  <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">Overridden: {r.override_score}</span>
                )}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">{r.reference_code}</p>
            </button>
            {expanded === r.id && (
              <div className="mt-3 pl-3 border-l-2 border-saffron-200 dark:border-saffron-900">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
                  Judge scores (informational, not editable here)
                </p>
                {scores.map((s) => (
                  <p key={s.id} className="text-sm">
                    {s.profiles?.full_name ?? 'Judge'}: {s.score} {s.remarks ? `- ${s.remarks}` : ''}
                  </p>
                ))}
                {scores.length === 0 && <p className="text-sm text-stone-500 dark:text-stone-400">No judge scores yet.</p>}

                <div className="flex gap-2 mt-3 items-center flex-wrap">
                  <input
                    type="number"
                    placeholder="Override score"
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(e.target.value)}
                    className={`${inputClass} w-32 py-1`}
                  />
                  <input
                    placeholder="Note (optional)"
                    value={overrideNote}
                    onChange={(e) => setOverrideNote(e.target.value)}
                    className={`${inputClass} flex-1 min-w-[150px] py-1`}
                  />
                  <button type="button" onClick={() => saveOverride(r.id)} className={`${secondaryButtonClass} py-1 text-sm`}>
                    Save Override
                  </button>
                  {r.override_score !== null && (
                    <button type="button" onClick={() => clearOverride(r.id)} className={`${dangerButtonClass} text-sm`}>
                      Clear Override
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {registrationsQuery.data?.length === 0 && (
        <p className="text-stone-500 dark:text-stone-400">No confirmed registrations yet.</p>
      )}
    </div>
  )
}
