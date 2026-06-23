import { cn } from '@/lib/utils'
import type { Match, PredictionWithUser } from '@/types'

type Props = {
  predictions: PredictionWithUser[]
  match: Match
  currentUserId: string | null
}

const WINNER_LABEL: Record<string, { label: string; cls: string }> = {
  home: { label: '홈 승', cls: 'text-blue-400' },
  draw: { label: '무승부', cls: 'text-slate-400' },
  away: { label: '원정 승', cls: 'text-orange-400' },
}

export default function PredictionList({ predictions, match, currentUserId }: Props) {
  if (predictions.length === 0) return null

  const isCompleted = match.status === 'completed'

  const sorted = [...predictions].sort((a, b) => {
    if (isCompleted) {
      const diff = (b.points_earned ?? 0) - (a.points_earned ?? 0)
      if (diff !== 0) return diff
      return (a.user_profiles?.name ?? '').localeCompare(b.user_profiles?.name ?? '', 'ko')
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  return (
    <div className="glass overflow-hidden rounded-xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs text-muted-foreground">
            <th className="px-4 py-3 text-left font-medium">참가자</th>
            <th className="px-4 py-3 text-center font-medium">예측 스코어</th>
            <th className="px-4 py-3 text-center font-medium">결과</th>
            {isCompleted && (
              <th className="px-4 py-3 text-right font-medium">점수</th>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((pred, idx) => {
            const isMe = pred.user_id === currentUserId
            const winner = WINNER_LABEL[pred.predicted_winner]
            const pts = pred.points_earned

            return (
              <tr
                key={pred.id}
                className={cn(
                  'border-b border-white/5 last:border-0 transition-colors',
                  isMe ? 'bg-primary/10' : idx % 2 === 0 ? '' : 'bg-white/[0.02]'
                )}
              >
                <td className="px-4 py-3">
                  <span className={cn('font-medium', isMe && 'text-primary')}>
                    {pred.user_profiles?.name ?? '알 수 없음'}
                  </span>
                  {isMe && (
                    <span className="ml-1.5 text-xs text-primary/70">(나)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center tabular-nums">
                  {match.home_country_name}{' '}
                  <span className="font-semibold">
                    {pred.predicted_home_score} : {pred.predicted_away_score}
                  </span>{' '}
                  {match.away_country_name}
                </td>
                <td className={cn('px-4 py-3 text-center text-xs font-medium', winner?.cls)}>
                  {winner?.label ?? '-'}
                </td>
                {isCompleted && (
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {pts === null ? (
                      <span className="text-muted-foreground">-</span>
                    ) : pts > 0 ? (
                      <span className="text-green-400">+{pts}점</span>
                    ) : (
                      <span className="text-red-400">0점</span>
                    )}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
