import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { cardClass } from '../../lib/ui'

export function AdminOverview() {
  const statsQuery = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => {
      const [{ count: total }, { count: pending }, { count: confirmed }, { count: rejected }] =
        await Promise.all([
          supabase.from('registrations').select('*', { count: 'exact', head: true }),
          supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
          supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
        ])
      return { total: total ?? 0, pending: pending ?? 0, confirmed: confirmed ?? 0, rejected: rejected ?? 0 }
    },
  })

  const stats = statsQuery.data

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6 text-saffron-800 dark:text-saffron-200">Admin Overview</h1>
      {statsQuery.isLoading && <p>Loading...</p>}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Registrations" value={stats.total} />
          <StatCard label="Pending" value={stats.pending} />
          <StatCard label="Confirmed" value={stats.confirmed} />
          <StatCard label="Rejected" value={stats.rejected} />
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={cardClass}>
      <p className="text-sm text-stone-500 dark:text-stone-400">{label}</p>
      <p className="text-2xl font-semibold text-saffron-700 dark:text-saffron-300">{value}</p>
    </div>
  )
}
