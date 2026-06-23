import { createClientSafe } from '@/lib/supabase/server'
import RoundTabs from '@/components/matches/RoundTabs'
import MatchCard from '@/components/matches/MatchCard'
import { ROUNDS, type Match, type Prediction, type Round } from '@/types'

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ round?: string }>
}) {
  const { round: rawRound } = await searchParams
  const round: Round = (ROUNDS.includes(rawRound as Round) ? rawRound : 'group') as Round

  const supabase = await createClientSafe()
  let matches: Match[] = []
  let myPredictions: Record<string, Prediction> = {}

  if (supabase) {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('round', round)
      .order('kickoff_at', { ascending: true })

    matches = (data ?? []) as Match[]

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user && matches.length > 0) {
      const { data: preds } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id)
        .in(
          'match_id',
          matches.map((m) => m.id)
        )

      myPredictions = ((preds ?? []) as Prediction[]).reduce<Record<string, Prediction>>(
        (acc, p) => ({ ...acc, [p.match_id]: p }),
        {}
      )
    }
  }

  // 조별리그: 그룹별 묶기
  const groupedMatches: Record<string, Match[]> = {}
  if (round === 'group') {
    for (const m of matches) {
      const g = m.group_name ?? '기타'
      if (!groupedMatches[g]) groupedMatches[g] = []
      groupedMatches[g].push(m)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">경기 일정</h1>

      <RoundTabs currentRound={round} />

      <div className="mt-6">
        {matches.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center text-muted-foreground">
            등록된 경기가 없습니다
          </div>
        ) : round === 'group' ? (
          <div className="space-y-8">
            {Object.entries(groupedMatches)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([groupName, groupMatches]) => (
                <div key={groupName}>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {groupName}조
                  </h2>
                  <div className="space-y-3">
                    {groupMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        prediction={myPredictions[match.id]}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={myPredictions[match.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
