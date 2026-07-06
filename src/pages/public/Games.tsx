import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { AgeCategory, Game } from '../../types/db'
import { cardClass } from '../../lib/ui'

export function Games() {
  const gamesQuery = useQuery({
    queryKey: ['games', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return data as Game[]
    },
  })

  const ageCategoriesQuery = useQuery({
    queryKey: ['age_categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('age_categories').select('*').order('sort_order')
      if (error) throw error
      return data as AgeCategory[]
    },
  })

  if (gamesQuery.isLoading || ageCategoriesQuery.isLoading) return <p>Loading games...</p>
  if (gamesQuery.error) return <p className="text-red-600">Failed to load games.</p>

  const ageCategories = ageCategoriesQuery.data ?? []

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2 text-saffron-800 dark:text-saffron-200">Games</h1>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
        Sample games shown for MVP - the real Kalanjali 2026 lineup will replace this list.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {ageCategories.map((ac) => (
          <span
            key={ac.id}
            className="text-xs border border-saffron-300 dark:border-saffron-800 text-saffron-800 dark:text-saffron-200 rounded-full px-3 py-1"
          >
            {ac.name} ({ac.min_age}
            {ac.max_age ? `-${ac.max_age}` : '+'})
          </span>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {gamesQuery.data?.map((game) => (
          <div key={game.id} className={cardClass}>
            <h2 className="font-semibold text-saffron-800 dark:text-saffron-200">{game.name}</h2>
            {game.description && <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{game.description}</p>}
            <p className="text-xs mt-2 text-stone-500 dark:text-stone-400">
              {game.is_team_event
                ? `Team event (${game.min_team_size ?? '?'}-${game.max_team_size ?? '?'} members)`
                : 'Individual event'}
              {game.gender_restriction !== 'any' && (
                <span className="ml-2 text-saffron-700 dark:text-saffron-300">
                  {game.gender_restriction === 'male' ? 'Male' : 'Female'} only
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
