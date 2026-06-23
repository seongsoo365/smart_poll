import { cn } from '@/lib/utils'
import type { Match } from '@/types'

type Stats = {
  home: number
  draw: number
  away: number
  total: number
}

type Bar = {
  label: string
  count: number
  pct: number
  color: string
}

export default function PredictionStats({ match, stats }: { match: Match; stats: Stats }) {
  const { home, draw, away, total } = stats

  if (total === 0) {
    return (
      <div className="glass rounded-xl p-6 text-center text-sm text-muted-foreground">
        아직 예측한 참가자가 없습니다
      </div>
    )
  }

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

  const bars: Bar[] = [
    { label: `${match.home_country_name} 승`, count: home, pct: pct(home), color: 'bg-blue-500' },
    { label: '무승부', count: draw, pct: pct(draw), color: 'bg-slate-500' },
    { label: `${match.away_country_name} 승`, count: away, pct: pct(away), color: 'bg-orange-500' },
  ]

  return (
    <div className="glass rounded-xl p-6">
      <p className="mb-4 text-sm font-medium text-muted-foreground">
        참가자 예측 현황 <span className="text-foreground font-semibold">{total}명</span>
      </p>
      <div className="space-y-4">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="font-medium">{bar.label}</span>
              <span className="text-muted-foreground">
                {bar.pct}%{' '}
                <span className="text-xs">({bar.count}명)</span>
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={cn('h-2.5 rounded-full transition-all duration-500', bar.color)}
                style={{ width: `${bar.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
