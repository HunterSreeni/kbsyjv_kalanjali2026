import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { AgeCategory, Game } from '../../types/db'
import { Turnstile } from '../../components/Turnstile'
import { inputClass, selectClass, primaryButtonClass } from '../../lib/ui'

interface ParticipantInput {
  full_name: string
  age: number
  gender: string
  is_captain: boolean
}

interface RegisterFormValues {
  game_id: string
  age_category_id: string
  team_name: string
  contact_name: string
  contact_phone: string
  contact_email: string
  hp_token_9f3: string // honeypot - real users never see or fill this
  participants: ParticipantInput[]
}

const emptyParticipant: ParticipantInput = { full_name: '', age: 0, gender: '', is_captain: false }

export function Register() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [referenceCode, setReferenceCode] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      game_id: '',
      age_category_id: '',
      team_name: '',
      contact_name: '',
      contact_phone: '',
      contact_email: '',
      hp_token_9f3: '',
      participants: [emptyParticipant],
    },
  })

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'participants' })

  const gameId = watch('game_id')
  const selectedGame = gamesQuery.data?.find((g) => g.id === gameId)
  const isTeamEvent = selectedGame?.is_team_event ?? false

  const genderRestriction = selectedGame?.gender_restriction ?? 'any'

  // Switching games leaves a completely different team-size/age-category shape,
  // so start the member list fresh instead of carrying over the old game's rows.
  // selectedGame itself is a new object reference each render, so this keys off
  // the primitive fields that actually matter instead of looping forever.
  useEffect(() => {
    replace([{ ...emptyParticipant, gender: genderRestriction !== 'any' ? genderRestriction : '' }])
    setValue('team_name', '')
  }, [gameId, genderRestriction, replace, setValue])

  async function onSubmit(values: RegisterFormValues) {
    setSubmitError(null)

    if (values.hp_token_9f3.trim() !== '') {
      // Honeypot tripped - pretend success, don't actually submit.
      setReferenceCode('SUBMITTED')
      return
    }
    if (!turnstileToken) {
      setSubmitError('Please complete the verification check above.')
      return
    }

    setSubmitting(true)
    try {
      // Team size / age-category bounds and the Turnstile token itself are
      // re-validated server-side in this function - the client checks are just
      // for fast feedback, they are never trusted on their own.
      const { data, error } = await supabase.functions.invoke('submit-registration', {
        body: {
          game_id: values.game_id,
          age_category_id: values.age_category_id,
          team_name: isTeamEvent ? values.team_name.trim() : undefined,
          contact_name: values.contact_name.trim(),
          contact_phone: values.contact_phone.trim(),
          contact_email: values.contact_email.trim() || undefined,
          participants: values.participants.map((p) => ({
            full_name: p.full_name.trim(),
            age: p.age,
            gender: p.gender || undefined,
            is_captain: p.is_captain,
          })),
          turnstile_token: turnstileToken,
        },
      })

      if (error) {
        if (error instanceof FunctionsHttpError) {
          const body = await error.context.json().catch(() => null)
          throw new Error(body?.error ?? error.message)
        }
        throw error
      }
      if (data?.error) throw new Error(data.error)

      setReferenceCode(data.reference_code)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (referenceCode) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="text-2xl font-semibold mb-2 text-saffron-800 dark:text-saffron-200">Registration submitted</h1>
        <p className="text-stone-500 dark:text-stone-400 mb-4">
          Your registration is pending Admin approval. Keep this reference code for your records:
        </p>
        <p className="text-lg font-mono border border-saffron-300 dark:border-saffron-800 rounded px-4 py-2 inline-block text-saffron-800 dark:text-saffron-200">
          {referenceCode}
        </p>
      </div>
    )
  }

  if (gamesQuery.isLoading || ageCategoriesQuery.isLoading) return <p>Loading form...</p>

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-saffron-800 dark:text-saffron-200">Register</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Honeypot field - hidden from real users via CSS, bots often fill every input */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register('hp_token_9f3')}
          className="absolute -left-[9999px] w-px h-px opacity-0"
          aria-hidden="true"
        />

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Game</span>
          <select {...register('game_id', { required: true })} className={selectClass}>
            <option value="">Select a game</option>
            {gamesQuery.data?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Age Category</span>
          <select {...register('age_category_id', { required: true })} className={selectClass}>
            <option value="">Select an age category</option>
            {ageCategoriesQuery.data?.map((ac) => (
              <option key={ac.id} value={ac.id}>
                {ac.name} ({ac.min_age}
                {ac.max_age ? `-${ac.max_age}` : '+'})
              </option>
            ))}
          </select>
        </label>

        {selectedGame && genderRestriction !== 'any' && (
          <p className="text-sm text-saffron-700 dark:text-saffron-300 -mt-2">
            {selectedGame.name} is restricted to {genderRestriction} participants only.
          </p>
        )}

        {isTeamEvent && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Team Name</span>
            <input {...register('team_name')} className={inputClass} />
          </label>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
              {isTeamEvent ? 'Team Members' : 'Participant'}
            </span>
            {isTeamEvent && (
              <button
                type="button"
                onClick={() =>
                  append({ ...emptyParticipant, gender: genderRestriction !== 'any' ? genderRestriction : '' })
                }
                className="text-sm underline text-saffron-700 dark:text-saffron-300"
              >
                + Add member
              </button>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="border border-saffron-200 dark:border-saffron-900 rounded p-3 flex gap-2"
              >
                <input
                  placeholder="Full name"
                  {...register(`participants.${index}.full_name`, { required: true })}
                  className={`${inputClass} flex-1 py-1`}
                />
                <input
                  type="number"
                  placeholder="Age"
                  {...register(`participants.${index}.age`, { required: true, valueAsNumber: true, min: 1 })}
                  className={`${inputClass} w-20 py-1`}
                />
                {genderRestriction !== 'any' ? (
                  <>
                    <input type="hidden" {...register(`participants.${index}.gender`)} />
                    <span className={`${selectClass} py-1 flex items-center`}>
                      {genderRestriction === 'male' ? 'Male' : 'Female'}
                    </span>
                  </>
                ) : (
                  <select
                    {...register(`participants.${index}.gender`, { required: true })}
                    className={`${selectClass} py-1`}
                  >
                    <option value="">Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                )}
                {isTeamEvent && fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600 dark:text-red-400 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Contact Name</span>
          <input {...register('contact_name', { required: true })} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Contact Phone</span>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={15}
            placeholder="10-digit phone number"
            {...register('contact_phone', {
              required: true,
              pattern: /^[0-9]{10}$/,
              onChange: (e) => {
                // Take the last 10 digits, not the first 10 - handles pasted
                // numbers with a leading country code (e.g. +91-9876543210)
                // without truncating into the middle of the real number.
                // maxLength=15 above just bounds raw paste length (with a
                // country code, dashes, spaces) before this runs.
                const digits = e.target.value.replace(/\D/g, '')
                e.target.value = digits.slice(-10)
              },
            })}
            className={inputClass}
          />
          {errors.contact_phone && (
            <span className="text-red-600 dark:text-red-400 text-xs">Enter a 10-digit phone number</span>
          )}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Contact Email (optional)</span>
          <input type="email" {...register('contact_email')} className={inputClass} />
        </label>

        <Turnstile onVerify={setTurnstileToken} />

        {submitError && <p className="text-red-600 dark:text-red-400 text-sm">{submitError}</p>}

        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {submitting ? 'Submitting...' : 'Submit Registration'}
        </button>
      </form>
    </div>
  )
}
