// Public registration entry point. Runs with the service role key (server-side only)
// so it can enforce rules the anon key must never be trusted to enforce itself:
// forcing status='pending', verifying the Turnstile token against Cloudflare,
// and validating team size / participant age against the selected game & category.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ParticipantInput {
  full_name: string
  age: number
  gender?: string
  is_captain?: boolean
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const body = await req.json()
    const {
      game_id,
      age_category_id,
      team_name,
      contact_name,
      contact_phone,
      contact_email,
      participants,
      turnstile_token,
    } = body as {
      game_id: string
      age_category_id: string
      team_name?: string
      contact_name: string
      contact_phone: string
      contact_email?: string
      participants: ParticipantInput[]
      turnstile_token: string
    }

    if (!game_id || !age_category_id || !contact_name?.trim() || !contact_phone?.trim()) {
      return json({ error: 'Missing required fields' }, 400)
    }
    if (!Array.isArray(participants) || participants.length === 0) {
      return json({ error: 'At least one participant is required' }, 400)
    }
    if (contact_email && !EMAIL_RE.test(contact_email)) {
      return json({ error: 'Invalid contact email' }, 400)
    }

    const turnstileSecret =
      Deno.env.get('TURNSTILE_SECRET_KEY') ?? '1x0000000000000000000000000000000AA' // Cloudflare public test secret - replace via `supabase secrets set` before production

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: turnstileSecret, response: turnstile_token ?? '' }),
    })
    const verifyData = await verifyRes.json()
    if (!verifyData.success) {
      return json({ error: 'Verification check failed. Please retry.' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', game_id)
      .eq('is_active', true)
      .single()
    if (gameError || !game) return json({ error: 'Invalid or inactive game' }, 400)

    const { data: ageCategory, error: ageCategoryError } = await supabase
      .from('age_categories')
      .select('*')
      .eq('id', age_category_id)
      .single()
    if (ageCategoryError || !ageCategory) return json({ error: 'Invalid age category' }, 400)

    if (game.is_team_event) {
      if (!team_name?.trim()) return json({ error: 'Team name is required for team events' }, 400)
      if (game.min_team_size && participants.length < game.min_team_size) {
        return json({ error: `This event needs at least ${game.min_team_size} team members` }, 400)
      }
      if (game.max_team_size && participants.length > game.max_team_size) {
        return json({ error: `This event allows at most ${game.max_team_size} team members` }, 400)
      }
    } else if (participants.length !== 1) {
      return json({ error: 'Individual events require exactly one participant' }, 400)
    }

    for (const p of participants) {
      if (!p.full_name?.trim() || typeof p.age !== 'number' || p.age <= 0) {
        return json({ error: 'Each participant needs a name and a valid age' }, 400)
      }
      if (p.age < ageCategory.min_age || (ageCategory.max_age !== null && p.age > ageCategory.max_age)) {
        return json({ error: `${p.full_name} (age ${p.age}) is outside the ${ageCategory.name} range` }, 400)
      }
      if (game.gender_restriction !== 'any' && p.gender !== game.gender_restriction) {
        return json({ error: `${game.name} is restricted to ${game.gender_restriction} participants only` }, 400)
      }
    }

    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .insert({
        game_id,
        age_category_id,
        team_name: game.is_team_event ? team_name!.trim() : null,
        contact_name: contact_name.trim(),
        contact_phone: contact_phone.trim(),
        contact_email: contact_email?.trim() || null,
        status: 'pending',
      })
      .select()
      .single()
    if (regError || !registration) return json({ error: 'Failed to create registration' }, 500)

    const participantsPayload = participants.map((p) => ({
      registration_id: registration.id,
      full_name: p.full_name.trim(),
      age: p.age,
      gender: p.gender || null,
      is_captain: !!p.is_captain,
    }))

    const { error: partError } = await supabase.from('participants').insert(participantsPayload)
    if (partError) {
      // Compensating rollback - not a true transaction, but keeps orphaned
      // registrations from accumulating if the second insert fails.
      await supabase.from('registrations').delete().eq('id', registration.id)
      return json({ error: 'Failed to save participants' }, 500)
    }

    return json({ reference_code: registration.reference_code }, 200)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 500)
  }
})
