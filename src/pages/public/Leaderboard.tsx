import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { AgeCategory, Game, LeaderboardRow } from '../../types/db'
import { selectClass } from '../../lib/ui'

export function Leaderboard() {
  const queryClient = useQueryClient()
  const [gameId, setGameId] = useState('')
  const [ageCategoryId, setAgeCategoryId] = useState('')

  const gamesQuery = useQuery({
    queryKey: ['games', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase.from('games').select('*').eq('is_active', true).order('name')
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

  const leaderboardQuery = useQuery({
    queryKey: ['leaderboard', gameId, ageCategoryId],
    queryFn: async () => {
      let query = supabase.from('leaderboard').select('*').order('game_name').order('rank')
      if (gameId) query = query.eq('game_id', gameId)
      if (ageCategoryId) query = query.eq('age_category_id', ageCategoryId)
      const { data, error } = await query
      if (error) throw error
      return data as LeaderboardRow[]
    },
  })

  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => {
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4 text-saffron-800 dark:text-saffron-200">Live Leaderboard</h1>

      <div className="flex gap-3 mb-6">
        <select value={gameId} onChange={(e) => setGameId(e.target.value)} className={selectClass}>
          <option value="">All games</option>
          {gamesQuery.data?.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select value={ageCategoryId} onChange={(e) => setAgeCategoryId(e.target.value)} className={selectClass}>
          <option value="">All age categories</option>
          {ageCategoriesQuery.data?.map((ac) => (
            <option key={ac.id} value={ac.id}>
              {ac.name}
            </option>
          ))}
        </select>
      </div>

      {leaderboardQuery.isLoading && <p>Loading leaderboard...</p>}
      {leaderboardQuery.error && <p className="text-red-600 dark:text-red-400">Failed to load leaderboard.</p>}

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b border-saffron-300 dark:border-saffron-800 text-saffron-800 dark:text-saffron-200">
            <th className="py-2">Rank</th>
            <th>Game</th>
            <th>Age Category</th>
            <th>Team / Entry</th>
            <th>Score</th>
            <th>Judged By</th>
          </tr>
        </thead>
        <tbody>
          {leaderboardQuery.data?.map((row) => (
            <tr key={row.registration_id} className="border-b border-saffron-100 dark:border-saffron-900">
              <td className="py-2">{row.rank}</td>
              <td>{row.game_name}</td>
              <td>{row.age_category_name}</td>
              <td>{row.team_name ?? '-'}</td>
              <td>{row.avg_score.toFixed(2)}</td>
              <td>
                {row.is_override
                  ? 'Final (admin)'
                  : row.score_count === 0
                    ? 'Not yet scored'
                    : `${row.score_count} judge${row.score_count === 1 ? '' : 's'}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {leaderboardQuery.data?.length === 0 && (
        <p className="text-stone-500 dark:text-stone-400 mt-4">No confirmed scores yet.</p>
      )}
    </div>
  )
}
