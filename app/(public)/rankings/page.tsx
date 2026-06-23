import { createClientSafe } from '@/lib/supabase/server'
import { Trophy } from 'lucide-react'
import { type RankEntry } from '@/types'

const MEDALS = ['🥇', '🥈', '🥉']

export default async function RankingsPage() {
  const supabase = await createClientSafe()
  let rankings: RankEntry[] = []

  if (supabase) {
    const [{ data: predictions }, { data: profiles }] = await Promise.all([
      supabase.from('predictions').select('user_id, points_earned'),
      supabase.from('user_profiles').select('id, name'),
    ])

    const profileMap = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p.name as string])
    )

    const rankMap: Record<string, RankEntry> = {}

    for (const pred of predictions ?? []) {
      if (!rankMap[pred.user_id]) {
        rankMap[pred.user_id] = {
          user_id: pred.user_id,
          name: profileMap[pred.user_id] ?? '알 수 없음',
          total_points: 0,
          correct_count: 0,
          exact_count: 0,
          predicted_count: 0,
        }
      }
      const entry = rankMap[pred.user_id]
      entry.predicted_count += 1
      const pts = pred.points_earned ?? 0
      if (pred.points_earned !== null) {
        entry.total_points += pts
        if (pts >= 3) entry.correct_count += 1
        if (pts >= 10) entry.exact_count += 1
      }
    }

    rankings = Object.values(rankMap).sort(
      (a, b) =>
        b.total_points - a.total_points ||
        b.correct_count - a.correct_count ||
        b.exact_count - a.exact_count
    )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Trophy className="size-6 text-accent" />
        <h1 className="text-2xl font-bold">전체 순위</h1>
      </div>

      {rankings.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-muted-foreground">
          아직 집계된 결과가 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {rankings.map((entry, idx) => {
            const rank = idx + 1
            const medal = MEDALS[idx]

            return (
              <div
                key={entry.user_id}
                className="glass flex items-center gap-4 rounded-xl p-4"
              >
                {/* 순위 */}
                <div className="w-10 text-center">
                  {medal ? (
                    <span className="text-2xl">{medal}</span>
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">{rank}</span>
                  )}
                </div>

                {/* 이름 */}
                <div className="flex-1 font-medium">{entry.name}</div>

                {/* 통계 */}
                <div className="hidden gap-6 text-right text-sm sm:flex">
                  <div>
                    <p className="text-xs text-muted-foreground">예측</p>
                    <p className="font-medium">{entry.predicted_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">정답</p>
                    <p className="font-medium">{entry.correct_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">정확</p>
                    <p className="font-medium">{entry.exact_count}</p>
                  </div>
                </div>

                {/* 총 점수 */}
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{entry.total_points}점</p>
                  <p className="text-xs text-muted-foreground sm:hidden">
                    정답 {entry.correct_count}개
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {rankings.length > 0 && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          동점 시 정답 수 → 정확한 스코어 수 순으로 순위 결정
        </p>
      )}
    </div>
  )
}
