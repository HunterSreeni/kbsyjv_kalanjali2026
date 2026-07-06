import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Game, GenderRestriction } from '../../types/db'
import { cardClass, inputClass, primaryButtonClass } from '../../lib/ui'

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function AdminGames() {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [newIsTeam, setNewIsTeam] = useState(false)
  const [newGenderRestriction, setNewGenderRestriction] = useState<GenderRestriction>('any')
  const [error, setError] = useState<string | null>(null)

  const gamesQuery = useQuery({
    queryKey: ['admin', 'games'],
    queryFn: async () => {
      const { data, error } = await supabase.from('games').select('*').order('name')
      if (error) throw error
      return data as Game[]
    },
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'games'] })
    queryClient.invalidateQueries({ queryKey: ['games'] })
  }

  async function addGame() {
    if (!newName.trim()) return
    setError(null)
    const { error } = await supabase.from('games').insert({
      name: newName.trim(),
      slug: slugify(newName),
      is_team_event: newIsTeam,
      gender_restriction: newGenderRestriction,
    })
    if (error) {
      setError(error.message)
      return
    }
    setNewName('')
    setNewIsTeam(false)
    setNewGenderRestriction('any')
    invalidate()
  }

  async function updateGame(id: string, patch: Partial<Game>) {
    await supabase.from('games').update(patch).eq('id', id)
    invalidate()
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2 text-saffron-800 dark:text-saffron-200">Games</h1>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
        Sample games are placeholders - replace/edit here once the real Kalanjali 2026 list is confirmed.
      </p>

      <div className={`${cardClass} mb-6 flex gap-2 items-center`}>
        <input
          placeholder="New game name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className={`${inputClass} flex-1 py-1`}
        />
        <label className="text-sm flex items-center gap-1 text-stone-700 dark:text-stone-300">
          <input type="checkbox" checked={newIsTeam} onChange={(e) => setNewIsTeam(e.target.checked)} />
          Team event
        </label>
        <select
          value={newGenderRestriction}
          onChange={(e) => setNewGenderRestriction(e.target.value as GenderRestriction)}
          className={`${inputClass} py-1 text-sm w-28`}
        >
          <option value="any">Any gender</option>
          <option value="male">Male only</option>
          <option value="female">Female only</option>
        </select>
        <button type="button" onClick={addGame} className={`${primaryButtonClass} py-1 text-sm`}>
          Add Game
        </button>
      </div>
      {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>}

      <div className="flex flex-col gap-2">
        {gamesQuery.data?.map((game) => (
          <div key={game.id} className={cardClass}>
            <div className="flex items-center gap-2 mb-2">
              <input
                defaultValue={game.name}
                onBlur={(e) => e.target.value !== game.name && updateGame(game.id, { name: e.target.value })}
                className={`${inputClass} flex-1 py-1 font-medium`}
              />
              <label className="text-xs flex items-center gap-1 text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={game.is_active}
                  onChange={(e) => updateGame(game.id, { is_active: e.target.checked })}
                />
                Active
              </label>
              <label className="text-xs flex items-center gap-1 text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={game.is_team_event}
                  onChange={(e) => updateGame(game.id, { is_team_event: e.target.checked })}
                />
                Team event
              </label>
              <select
                value={game.gender_restriction}
                onChange={(e) => updateGame(game.id, { gender_restriction: e.target.value as GenderRestriction })}
                className={`${inputClass} py-1 text-xs w-28`}
              >
                <option value="any">Any gender</option>
                <option value="male">Male only</option>
                <option value="female">Female only</option>
              </select>
            </div>
            <textarea
              defaultValue={game.description ?? ''}
              onBlur={(e) => e.target.value !== game.description && updateGame(game.id, { description: e.target.value })}
              placeholder="Description"
              className={`${inputClass} w-full py-1 text-sm mb-2`}
            />
            {game.is_team_event && (
              <div className="flex gap-2 text-sm text-stone-700 dark:text-stone-300">
                <label className="flex items-center gap-1">
                  Min
                  <input
                    type="number"
                    defaultValue={game.min_team_size ?? ''}
                    onBlur={(e) => updateGame(game.id, { min_team_size: e.target.value ? Number(e.target.value) : null })}
                    className={`${inputClass} w-16 py-1`}
                  />
                </label>
                <label className="flex items-center gap-1">
                  Max
                  <input
                    type="number"
                    defaultValue={game.max_team_size ?? ''}
                    onBlur={(e) => updateGame(game.id, { max_team_size: e.target.value ? Number(e.target.value) : null })}
                    className={`${inputClass} w-16 py-1`}
                  />
                </label>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
