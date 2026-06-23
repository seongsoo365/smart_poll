export type Round = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third_place' | 'final'
export type MatchStatus = 'scheduled' | 'in_progress' | 'completed'
export type PredictedWinner = 'home' | 'draw' | 'away'
export type UserRole = 'system_admin' | 'participant'

export type UserProfile = {
  id: string
  email: string
  name: string
  role: UserRole
  is_approved: boolean
  provider: string
  avatar_url: string | null
  created_at: string
}

export type Match = {
  id: string
  round: Round
  group_name: string | null
  match_number: number
  home_country_code: string
  away_country_code: string
  home_country_name: string
  away_country_name: string
  kickoff_at: string
  venue: string | null
  status: MatchStatus
  home_score: number | null
  away_score: number | null
  prediction_locked_at: string | null
  is_prediction_open: boolean
  created_at: string
}

export type Prediction = {
  id: string
  user_id: string
  match_id: string
  predicted_winner: PredictedWinner
  predicted_home_score: number
  predicted_away_score: number
  points_earned: number | null
  created_at: string
  updated_at: string
}

export type PredictionWithUser = Prediction & {
  user_profiles: {
    name: string
    avatar_url: string | null
  } | null
}

export type ScoringRule = {
  id: string
  rule_type: 'winner' | 'exact_score'
  points: number
  is_active: boolean
  description: string | null
}

export type ScoringRules = {
  winner: number
  exact_score: number
}

export type RankEntry = {
  user_id: string
  name: string
  total_points: number
  correct_count: number
  exact_count: number
  predicted_count: number
}

export const ROUND_LABELS: Record<Round, string> = {
  group: '조별리그',
  r32: '32강',
  r16: '16강',
  qf: '8강',
  sf: '준결승',
  third_place: '3위 결정전',
  final: '결승',
}

export const ROUNDS: Round[] = ['group', 'r32', 'r16', 'qf', 'sf', 'third_place', 'final']

// 스코어로 승무패 자동 판별
export function getWinnerFromScore(homeScore: number, awayScore: number): PredictedWinner {
  if (homeScore > awayScore) return 'home'
  if (homeScore < awayScore) return 'away'
  return 'draw'
}

// prediction_locked_at이 없으면 kickoff - 1시간으로 계산
export function isMatchLocked(match: Pick<Match, 'kickoff_at' | 'prediction_locked_at'>): boolean {
  const lockTime = match.prediction_locked_at
    ? new Date(match.prediction_locked_at)
    : new Date(new Date(match.kickoff_at).getTime() - 3600000)
  return lockTime <= new Date()
}

export function formatKickoffKST(kickoffAt: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(kickoffAt).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
    ...options,
  })
}
