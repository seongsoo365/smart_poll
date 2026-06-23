import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isMatchLocked, formatKickoffKST, ROUND_LABELS, type Match, type Prediction } from '@/types'

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') return <Badge variant="secondary">완료</Badge>
  if (status === 'in_progress') return <Badge className="animate-pulse bg-green-500/20 text-green-400 border-green-500/30">진행중</Badge>
  return <Badge variant="outline">예정</Badge>
}

function PredictionResult({ match, prediction }: { match: Match; prediction: Prediction }) {
  if (match.status !== 'completed') {
    return (
      <span className="text-xs text-accent">
        내 예측: {prediction.predicted_home_score}:{prediction.predicted_away_score}
      </span>
    )
  }
  const pts = prediction.points_earned ?? 0
  if (pts >= 10) {
    return (
      <span className="flex items-center gap-1 text-xs text-green-400">
        <CheckCircle2 className="size-3" />
        {prediction.predicted_home_score}:{prediction.predicted_away_score} 정확 +{pts}점
      </span>
    )
  }
  if (pts >= 3) {
    return (
      <span className="flex items-center gap-1 text-xs text-blue-400">
        <CheckCircle2 className="size-3" />
        {prediction.predicted_home_score}:{prediction.predicted_away_score} 승무패 정답 +{pts}점
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-red-400">
      <XCircle className="size-3" />
      {prediction.predicted_home_score}:{prediction.predicted_away_score} 오답
    </span>
  )
}

export default function MatchCard({
  match,
  prediction,
}: {
  match: Match
  prediction?: Prediction
}) {
  const locked = isMatchLocked(match)

  return (
    <Link href={`/matches/${match.id}`}>
      <div className="glass rounded-xl p-4 transition-all hover:border-primary/40 hover:bg-white/[0.08]">
        {/* 상단: 상태 + 라운드 + 시간 */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={match.status} />
            {match.group_name && (
              <Badge variant="outline" className="text-xs">{match.group_name}조</Badge>
            )}
            {match.round !== 'group' && (
              <Badge variant="outline" className="text-xs">{ROUND_LABELS[match.round]}</Badge>
            )}
          </div>
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {formatKickoffKST(match.kickoff_at)}
          </span>
        </div>

        {/* 중앙: 팀명 + 스코어 */}
        <div className="my-3 flex items-center justify-center gap-6 text-center">
          <span className={cn('text-base font-semibold md:text-lg', prediction?.predicted_winner === 'home' && match.status !== 'completed' && 'text-primary')}>
            {match.home_country_name}
          </span>
          {match.status === 'completed' ? (
            <span className="text-xl font-bold text-primary tabular-nums">
              {match.home_score}&nbsp;:&nbsp;{match.away_score}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">vs</span>
          )}
          <span className={cn('text-base font-semibold md:text-lg', prediction?.predicted_winner === 'away' && match.status !== 'completed' && 'text-primary')}>
            {match.away_country_name}
          </span>
        </div>

        {/* 하단: 경기장 + 내 예측 */}
        <div className="flex items-center justify-between gap-2">
          {match.venue ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {match.venue}
            </span>
          ) : (
            <span />
          )}

          <div className="text-right text-xs">
            {prediction ? (
              <PredictionResult match={match} prediction={prediction} />
            ) : (
              !locked && match.status === 'scheduled' && (
                <span className="text-primary">예측하기 →</span>
              )
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
