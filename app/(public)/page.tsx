import Link from 'next/link'
import { createClientSafe, supabaseConfigured } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Calendar, Trophy, TrendingUp, Vote } from 'lucide-react'
import DateNav from '@/components/home/DateNav'
import { type Match, type Prediction } from '@/types'
import MatchCard from '@/components/matches/MatchCard'

const TOURNAMENT_START = '2026-06-11'
const TOURNAMENT_END = '2026-07-19'

function todayKST(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10)
}

type RankEntry = {
  user_id: string
  name: string
  total_points: number
  correct_count: number
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date: rawDate } = await searchParams

  const today = todayKST()
  const selectedDate =
    rawDate && rawDate >= TOURNAMENT_START && rawDate <= TOURNAMENT_END
      ? rawDate
      : today >= TOURNAMENT_START && today <= TOURNAMENT_END
        ? today
        : TOURNAMENT_START

  // 선택된 KST 날짜 → UTC 범위
  const dayStartUTC = new Date(selectedDate + 'T00:00:00+09:00').toISOString()
  const dayEndUTC   = new Date(selectedDate + 'T23:59:59+09:00').toISOString()

  const supabase = await createClientSafe()

  let openMatches: Match[] = []
  let myPredictions: Record<string, Prediction> = {}
  let topRankings: RankEntry[] = []

  if (supabase) {
    const [{ data: matchData }, predData] = await Promise.all([
      supabase
        .from('matches')
        .select('*')
        .eq('is_prediction_open', true)
        .gte('kickoff_at', dayStartUTC)
        .lte('kickoff_at', dayEndUTC)
        .order('kickoff_at', { ascending: true }),

      supabase
        .from('predictions')
        .select('user_id, points_earned, user_profiles(name)')
        .not('points_earned', 'is', null),
    ])

    openMatches = (matchData ?? []) as Match[]

    // 로그인 사용자의 내 예측 조회
    const { data: { user } } = await supabase.auth.getUser()
    if (user && openMatches.length > 0) {
      const { data: preds } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id)
        .in('match_id', openMatches.map((m) => m.id))

      myPredictions = ((preds ?? []) as Prediction[]).reduce<Record<string, Prediction>>(
        (acc, p) => ({ ...acc, [p.match_id]: p }),
        {}
      )
    }

    // TOP 3 랭킹
    const rows = predData.data ?? []
    const rankMap: Record<string, RankEntry> = {}
    for (const row of rows) {
      const profiles = row.user_profiles
      const profile = Array.isArray(profiles)
        ? (profiles[0] as { name: string } | undefined)
        : (profiles as { name: string } | null)
      if (!profile) continue
      if (!rankMap[row.user_id]) {
        rankMap[row.user_id] = { user_id: row.user_id, name: profile.name, total_points: 0, correct_count: 0 }
      }
      rankMap[row.user_id].total_points += row.points_earned ?? 0
      if ((row.points_earned ?? 0) > 0) rankMap[row.user_id].correct_count += 1
    }
    topRankings = Object.values(rankMap)
      .sort((a, b) => b.total_points - a.total_points || b.correct_count - a.correct_count)
      .slice(0, 3)
  }

  const medals = ['🥇', '🥈', '🥉']

  const selectedLabel = new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  return (
    <div className="container mx-auto px-4 py-10">
      {/* 히어로 */}
      <section className="mb-10 text-center">
        <div className="mb-4 text-6xl">🏆</div>
        <h1 className="mb-3 text-4xl font-bold tracking-tight">Smart Poll</h1>
        <p className="text-lg text-muted-foreground">
          북중미 월드컵 2026 승패 &amp; 스코어 예측 게임
        </p>
        {!supabaseConfigured && (
          <p className="mt-4 text-sm text-yellow-400">
            ⚠️ Supabase 설정 후 경기 데이터가 표시됩니다
          </p>
        )}
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        {/* 날짜별 예측 가능한 경기 */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Vote className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">예측 가능한 경기</h2>
          </div>

          {/* 날짜 네비게이터 */}
          <div className="glass mb-4 rounded-xl px-3 py-2">
            <DateNav selected={selectedDate} />
          </div>

          {/* 선택 날짜 레이블 */}
          <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Calendar className="size-4" />
            {selectedLabel}
          </p>

          {/* 경기 목록 */}
          <div className="space-y-3">
            {openMatches.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center text-muted-foreground">
                <p className="text-sm">이 날 예측 가능한 경기가 없습니다</p>
                <p className="mt-1 text-xs opacity-60">날짜를 변경하거나 관리자에게 문의하세요</p>
              </div>
            ) : (
              openMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={myPredictions[match.id]}
                />
              ))
            )}
          </div>

          <Button asChild variant="outline" className="mt-4 w-full">
            <Link href="/matches">전체 경기 일정 보기 →</Link>
          </Button>
        </section>

        {/* TOP 3 */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="size-5 text-accent" />
            <h2 className="text-xl font-semibold">현재 TOP 3</h2>
          </div>

          <div className="space-y-3">
            {topRankings.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center text-muted-foreground">
                아직 확정된 결과가 없습니다
              </div>
            ) : (
              topRankings.map((entry, idx) => (
                <div key={entry.user_id} className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{medals[idx]}</span>
                      <span className="font-medium">{entry.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">{entry.total_points}점</div>
                      <div className="text-xs text-muted-foreground">정답 {entry.correct_count}개</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <Button asChild variant="outline" className="mt-4 w-full">
            <Link href="/rankings">
              <TrendingUp className="size-4" />
              전체 순위 보기 →
            </Link>
          </Button>
        </section>
      </div>
    </div>
  )
}
