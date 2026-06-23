import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClientSafe } from '@/lib/supabase/server'
import PredictionForm from '@/components/matches/PredictionForm'
import PredictionStats from '@/components/matches/PredictionStats'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, MapPin, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  isMatchLocked,
  formatKickoffKST,
  ROUND_LABELS,
  type Match,
  type Prediction,
  type ScoringRules,
} from '@/types'

function TimeUntilLock({ lockedAt }: { lockedAt: string | null }) {
  if (!lockedAt) return null
  const diff = new Date(lockedAt).getTime() - Date.now()
  if (diff <= 0) return null

  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const label =
    hours > 24
      ? `${Math.floor(hours / 24)}일 후 마감`
      : hours > 0
        ? `${hours}시간 ${minutes}분 후 마감`
        : `${minutes}분 후 마감`

  return (
    <span className="flex items-center gap-1 text-accent">
      <Lock className="size-3.5" />
      {label}
    </span>
  )
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClientSafe()

  if (!supabase) notFound()

  const { data: matchRaw } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .single()

  if (!matchRaw) notFound()
  const match = matchRaw as Match

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let myPrediction: Prediction | undefined
  if (user) {
    const { data } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('match_id', id)
      .maybeSingle()
    myPrediction = (data ?? undefined) as Prediction | undefined
  }

  // 예측 통계 집계
  const { data: predStats } = await supabase
    .from('predictions')
    .select('predicted_winner')
    .eq('match_id', id)

  const stats = (predStats ?? []).reduce(
    (acc, p) => {
      if (p.predicted_winner === 'home') acc.home += 1
      else if (p.predicted_winner === 'draw') acc.draw += 1
      else if (p.predicted_winner === 'away') acc.away += 1
      acc.total += 1
      return acc
    },
    { home: 0, draw: 0, away: 0, total: 0 }
  )

  // 점수 규칙 조회
  const { data: rules } = await supabase
    .from('scoring_rules')
    .select('rule_type, points')
    .eq('is_active', true)

  const scoringRules: ScoringRules = {
    winner: (rules ?? []).find((r) => r.rule_type === 'winner')?.points ?? 3,
    exact_score: (rules ?? []).find((r) => r.rule_type === 'exact_score')?.points ?? 7,
  }

  const locked = isMatchLocked(match)

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* 뒤로 */}
      <Link
        href="/matches"
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> 경기 목록으로
      </Link>

      {/* 경기 헤더 카드 */}
      <div className="glass mb-6 rounded-xl p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{ROUND_LABELS[match.round]}</Badge>
          {match.group_name && <Badge variant="outline">{match.group_name}조</Badge>}
          {match.status === 'completed' && <Badge variant="secondary">완료</Badge>}
          {match.status === 'in_progress' && (
            <Badge className="animate-pulse bg-green-500/20 text-green-400 border-green-500/30">
              진행중
            </Badge>
          )}
        </div>

        {/* 팀 vs 팀 */}
        <div className="my-6 flex items-center justify-center gap-6 text-center">
          <div className="flex-1">
            <p className="text-2xl font-bold md:text-3xl">{match.home_country_name}</p>
            <p className="mt-1 text-xs text-muted-foreground">홈</p>
          </div>
          {match.status === 'completed' ? (
            <div className="text-4xl font-bold text-primary tabular-nums">
              {match.home_score}&nbsp;:&nbsp;{match.away_score}
            </div>
          ) : (
            <div className="text-2xl font-light text-muted-foreground">vs</div>
          )}
          <div className="flex-1">
            <p className="text-2xl font-bold md:text-3xl">{match.away_country_name}</p>
            <p className="mt-1 text-xs text-muted-foreground">원정</p>
          </div>
        </div>

        {/* 경기 정보 */}
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Clock className="size-4 shrink-0" />
            {formatKickoffKST(match.kickoff_at, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })} KST
          </span>
          {match.venue && (
            <span className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              {match.venue}
            </span>
          )}
          <TimeUntilLock lockedAt={match.prediction_locked_at} />
        </div>
      </div>

      {/* 완료된 경기: 내 결과 */}
      {match.status === 'completed' && myPrediction && (
        <div
          className={cn(
            'mb-6 rounded-xl border p-5 text-center',
            (myPrediction.points_earned ?? 0) > 0
              ? 'border-green-500/30 bg-green-500/10'
              : 'border-red-500/30 bg-red-500/10'
          )}
        >
          <p className="mb-1 text-sm text-muted-foreground">내 예측 결과</p>
          <p className="font-medium">
            {match.home_country_name} {myPrediction.predicted_home_score}
            &nbsp;:&nbsp;
            {myPrediction.predicted_away_score} {match.away_country_name}
          </p>
          <p className="mt-2 text-3xl font-bold">
            {(myPrediction.points_earned ?? 0) > 0 ? (
              <span className="text-green-400">+{myPrediction.points_earned}점 ✅</span>
            ) : (
              <span className="text-red-400">0점 ❌</span>
            )}
          </p>
        </div>
      )}

      {/* 예측 폼 (미완료 경기) */}
      {match.status !== 'completed' && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">
            {locked ? '🔒 예측 마감' : '✏️ 예측 입력'}
          </h2>
          <PredictionForm
            match={match}
            initialPrediction={myPrediction}
            isLoggedIn={!!user}
            isLocked={locked}
            scoringRules={scoringRules}
          />
        </div>
      )}

      {/* 예측 통계 */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">참가자 예측 현황</h2>
        <PredictionStats match={match} stats={stats} />
      </div>
    </div>
  )
}
