import Link from 'next/link'
import { createClientSafe, supabaseConfigured } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Trophy, TrendingUp } from 'lucide-react'

type Match = {
  id: string
  home_country_name: string
  away_country_name: string
  home_country_code: string
  away_country_code: string
  kickoff_at: string
  round: string
  group_name: string | null
  status: string
}

type RankEntry = {
  user_id: string
  name: string
  total_points: number
  correct_count: number
}

function getRoundLabel(round: string) {
  const labels: Record<string, string> = {
    group: '조별리그',
    r16: '16강',
    qf: '8강',
    sf: '4강',
    final: '결승',
  }
  return labels[round] ?? round
}

function formatKickoff(kickoffAt: string) {
  return new Date(kickoffAt).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  })
}

export default async function HomePage() {
  const supabase = await createClientSafe()

  let upcomingMatches: Match[] = []
  let topRankings: RankEntry[] = []

  if (supabase) {
    const now = new Date().toISOString()

    const { data: matches } = await supabase
      .from('matches')
      .select('id, home_country_name, away_country_name, home_country_code, away_country_code, kickoff_at, round, group_name, status')
      .gte('kickoff_at', now)
      .eq('status', 'scheduled')
      .order('kickoff_at', { ascending: true })
      .limit(3)

    upcomingMatches = matches ?? []

    // 누적 점수 집계 (서버에서 간단히 처리)
    const { data: predData } = await supabase
      .from('predictions')
      .select('user_id, points_earned, user_profiles(name)')
      .not('points_earned', 'is', null)

    if (predData) {
      const rankMap: Record<string, RankEntry> = {}
      for (const row of predData) {
        const profiles = row.user_profiles
      const profile = Array.isArray(profiles) ? profiles[0] as { name: string } | undefined : profiles as { name: string } | null
        if (!profile) continue
        if (!rankMap[row.user_id]) {
          rankMap[row.user_id] = {
            user_id: row.user_id,
            name: profile.name,
            total_points: 0,
            correct_count: 0,
          }
        }
        rankMap[row.user_id].total_points += row.points_earned ?? 0
        if ((row.points_earned ?? 0) > 0) rankMap[row.user_id].correct_count += 1
      }
      topRankings = Object.values(rankMap)
        .sort((a, b) => b.total_points - a.total_points || b.correct_count - a.correct_count)
        .slice(0, 3)
    }
  }

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="container mx-auto px-4 py-10">
      {/* 히어로 섹션 */}
      <section className="mb-12 text-center">
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
        {/* 예정된 경기 */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">예정된 경기</h2>
          </div>

          <div className="space-y-3">
            {upcomingMatches.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center text-muted-foreground">
                예정된 경기가 없습니다
              </div>
            ) : (
              upcomingMatches.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <div className="glass rounded-xl p-4 transition-all hover:border-primary/40 hover:bg-white/8">
                    <div className="mb-2 flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {getRoundLabel(match.round)}
                        {match.group_name ? ` ${match.group_name}조` : ''}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatKickoff(match.kickoff_at)} KST
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-lg font-semibold">
                      <span>{match.home_country_name}</span>
                      <span className="text-sm text-muted-foreground">vs</span>
                      <span>{match.away_country_name}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          <Button asChild variant="outline" className="mt-4 w-full">
            <Link href="/matches">전체 경기 보기 →</Link>
          </Button>
        </section>

        {/* 현재 순위 TOP 3 */}
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
