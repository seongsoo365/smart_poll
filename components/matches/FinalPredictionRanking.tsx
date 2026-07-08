import { type FinalPredictionEvent } from '@/types'

const MEDALS = ['🥇', '🥈', '🥉']

export type FinalPredictionRankEntry = {
  user_id: string
  name: string
  country_name_1: string
  country_name_2: string
  points_earned: number | null
}

type Props = {
  event: FinalPredictionEvent
  entries: FinalPredictionRankEntry[]
}

export default function FinalPredictionRanking({ event, entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center text-muted-foreground">
        제출된 예측이 없습니다
      </div>
    )
  }

  // 채점 전: 회원 예측 목록만 공개 (순위/점수 없음)
  if (!event.graded_at) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          아직 채점 전입니다. 결과가 확정되면 점수와 순위가 표시됩니다.
        </p>
        {entries.map((entry) => (
          <div key={entry.user_id} className="glass flex items-center gap-4 rounded-xl p-4">
            <div className="flex-1">
              <p className="font-medium">{entry.name}</p>
              <p className="text-xs text-muted-foreground">
                {entry.country_name_1} / {entry.country_name_2}
              </p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="glass rounded-xl p-4 text-center text-sm">
        실제 결승 진출국:{' '}
        <span className="font-semibold text-accent">
          {event.actual_country_name_1} / {event.actual_country_name_2}
        </span>
      </div>

      {entries.map((entry, idx) => {
        const rank = idx + 1
        const medal = MEDALS[idx]

        return (
          <div key={entry.user_id} className="glass flex items-center gap-4 rounded-xl p-4">
            <div className="w-10 text-center">
              {medal ? (
                <span className="text-2xl">{medal}</span>
              ) : (
                <span className="text-lg font-bold text-muted-foreground">{rank}</span>
              )}
            </div>

            <div className="flex-1">
              <p className="font-medium">{entry.name}</p>
              <p className="text-xs text-muted-foreground">
                {entry.country_name_1} / {entry.country_name_2}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xl font-bold text-primary">{entry.points_earned}점</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
