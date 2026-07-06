import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Game, Participant, Registration, RegistrationStatus } from '../../types/db'
import { cardClass, dangerButtonClass, secondaryButtonClass, selectClass, successButtonClass } from '../../lib/ui'

interface RegistrationRow extends Registration {
  games: Pick<Game, 'name'> | null
  age_categories: { name: string } | null
}

export function AdminRegistrations() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | ''>('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])

  const registrationsQuery = useQuery({
    queryKey: ['admin', 'registrations', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('registrations')
        .select('*, games(name), age_categories(name)')
        .order('created_at', { ascending: false })
      if (statusFilter) query = query.eq('status', statusFilter)
      const { data, error } = await query
      if (error) throw error
      return data as unknown as RegistrationRow[]
    },
  })

  async function updateStatus(id: string, status: RegistrationStatus) {
    const { error } = await supabase.from('registrations').update({ status }).eq('id', id)
    if (!error) queryClient.invalidateQueries({ queryKey: ['admin', 'registrations'] })
  }

  async function toggleExpand(id: string) {
    if (expanded === id) {
      setExpanded(null)
      return
    }
    const { data } = await supabase.from('participants').select('*').eq('registration_id', id)
    setParticipants((data as Participant[]) ?? [])
    setExpanded(id)
  }

  function exportCsv() {
    const rows = registrationsQuery.data ?? []
    const header = ['Reference', 'Game', 'Age Category', 'Team Name', 'Contact Name', 'Phone', 'Email', 'Status']
    const lines = rows.map((r) =>
      [
        r.reference_code,
        r.games?.name ?? '',
        r.age_categories?.name ?? '',
        r.team_name ?? '',
        r.contact_name,
        r.contact_phone,
        r.contact_email ?? '',
        r.status,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    )
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'registrations.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-saffron-800 dark:text-saffron-200">Registrations</h1>
        <button type="button" onClick={exportCsv} className={`${secondaryButtonClass} py-1 text-sm`}>
          Export CSV
        </button>
      </div>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as RegistrationStatus | '')}
        className={`${selectClass} mb-4`}
      >
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="rejected">Rejected</option>
      </select>

      {registrationsQuery.isLoading && <p>Loading...</p>}

      <div className="flex flex-col gap-2">
        {registrationsQuery.data?.map((r) => (
          <div key={r.id} className={cardClass}>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => toggleExpand(r.id)} className="text-left flex-1">
                <p className="font-medium text-saffron-800 dark:text-saffron-200">
                  {r.games?.name} - {r.team_name ?? r.contact_name} ({r.age_categories?.name})
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {r.reference_code} - {r.contact_name} - {r.contact_phone} - {r.status}
                </p>
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={r.status === 'confirmed'}
                  onClick={() => updateStatus(r.id, 'confirmed')}
                  className={`${successButtonClass} text-xs disabled:opacity-40`}
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={r.status === 'rejected'}
                  onClick={() => updateStatus(r.id, 'rejected')}
                  className={`${dangerButtonClass} text-xs disabled:opacity-40`}
                >
                  Reject
                </button>
              </div>
            </div>
            {expanded === r.id && (
              <div className="mt-3 pl-3 border-l-2 border-saffron-200 dark:border-saffron-900">
                {participants.map((p) => (
                  <p key={p.id} className="text-sm">
                    {p.full_name} (age {p.age}
                    {p.gender ? `, ${p.gender}` : ''})
                    {p.is_captain ? ' - Captain' : ''}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {registrationsQuery.data?.length === 0 && (
        <p className="text-stone-500 dark:text-stone-400">No registrations found.</p>
      )}
    </div>
  )
}
