import Link from 'next/link'
import { formatKickoffKST, ROUND_LABELS, type Match } from '@/types'

export type MatchResultStats = {
  first: number   // 정확한 스코어 (최고점)
  second: number  // 승무패만 정답
  third: number   // 오답 (0점)
  total: number
}

export default function MatchResultSummaryCard({
  match,
  stats,
}: {
  match: Match
  stats: MatchResultStats
}) {
  const { first, second, third, total } = stats

  return (
    <Link href={`/matches/${match.id}`}>
      <div className="glass rounded-xl p-4 transition-all hover:border-primary/40 hover:bg-white/[0.08]">
        {/* 경기 정보 */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {ROUND_LABELS[match.round]}
            {match.group_name ? ` · ${match.group_name}조` : ''}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatKickoffKST(match.kickoff_at, { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* 스코어 */}
        <div className="mb-3 flex items-center justify-center gap-4 text-center">
          <span className="flex-1 truncate text-right text-sm font-semibold">
            {match.home_country_name}
          </span>
          <span className="text-xl font-bold text-primary tabular-nums">
            {match.home_score}&nbsp;:&nbsp;{match.away_score}
          </span>
          <span className="flex-1 truncate text-left text-sm font-semibold">
            {match.away_country_name}
          </span>
        </div>

        {/* 등수 집계 */}
        {total === 0 ? (
          <p className="text-center text-xs text-muted-foreground">예측 참가자 없음</p>
        ) : (
          <div className="flex items-center justify-around rounded-lg bg-white/5 px-3 py-2.5">
            <div className="text-center">
              <p className="text-base">🥇</p>
              <p className="text-sm font-bold text-yellow-400">{first}명</p>
              <p className="text-xs text-muted-foreground">정확</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <p className="text-base">🥈</p>
              <p className="text-sm font-bold text-slate-300">{second}명</p>
              <p className="text-xs text-muted-foreground">승무패</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <p className="text-base">❌</p>
              <p className="text-sm font-bold text-red-400">{third}명</p>
              <p className="text-xs text-muted-foreground">오답</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <p className="text-base">👥</p>
              <p className="text-sm font-bold">{total}명</p>
              <p className="text-xs text-muted-foreground">총 예측</p>
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
