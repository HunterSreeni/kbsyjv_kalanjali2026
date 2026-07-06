export type RegistrationStatus = 'pending' | 'confirmed' | 'rejected'
export type ProfileRole = 'admin' | 'judge'
export type GenderRestriction = 'male' | 'female' | 'any'

export interface AgeCategory {
  id: string
  name: string
  min_age: number
  max_age: number | null
  sort_order: number
}

export interface Game {
  id: string
  name: string
  slug: string
  description: string | null
  is_team_event: boolean
  min_team_size: number | null
  max_team_size: number | null
  is_active: boolean
  gender_restriction: GenderRestriction
  created_at: string
}

export interface Registration {
  id: string
  game_id: string
  age_category_id: string
  team_name: string | null
  contact_name: string
  contact_phone: string
  contact_email: string | null
  status: RegistrationStatus
  reference_code: string
  override_score: number | null
  override_note: string | null
  created_at: string
}

export interface Participant {
  id: string
  registration_id: string
  full_name: string
  age: number
  gender: string | null
  is_captain: boolean
}

export interface Profile {
  id: string
  full_name: string | null
  role: ProfileRole
  created_at: string
}

export interface JudgeAssignment {
  id: string
  judge_profile_id: string
  game_id: string
}

export interface Score {
  id: string
  registration_id: string
  judge_id: string
  score: number
  remarks: string | null
  created_at: string
  updated_at: string
}

export interface LeaderboardRow {
  registration_id: string
  game_id: string
  game_name: string
  age_category_id: string
  age_category_name: string
  team_name: string | null
  avg_score: number
  score_count: number
  is_override: boolean
  rank: number
}
