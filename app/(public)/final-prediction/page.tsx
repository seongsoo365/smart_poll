import { createClientSafe } from '@/lib/supabase/server'
import { Flag } from 'lucide-react'
import {
  isFinalPredictionLocked,
  type CountryOption,
  type FinalPrediction,
  type FinalPredictionEvent,
  type Match,
} from '@/types'
import FinalPredictionForm from '@/components/matches/FinalPredictionForm'
import FinalPredictionRanking, {
  type FinalPredictionRankEntry,
} from '@/components/matches/FinalPredictionRanking'

export default async function FinalPredictionPage() {
  const supabase = await createClientSafe()

  let event: FinalPredictionEvent | null = null
  let countries: CountryOption[] = []
  let myPrediction: FinalPrediction | undefined
  let isLoggedIn = false
  let rankEntries: FinalPredictionRankEntry[] = []

  if (supabase) {
    const [{ data: eventData }, { data: matchData }] = await Promise.all([
      supabase.from('final_prediction_event').select('*').single(),
      supabase.from('matches').select('home_country_code, home_country_name, away_country_code, away_country_name'),
    ])

    event = eventData as FinalPredictionEvent | null

    const countryMap = new Map<string, string>()
    for (const m of (matchData ?? []) as Pick<
      Match,
      'home_country_code' | 'home_country_name' | 'away_country_code' | 'away_country_name'
    >[]) {
      countryMap.set(m.home_country_code, m.home_country_name)
      countryMap.set(m.away_country_code, m.away_country_name)
    }
    countries = Array.from(countryMap, ([code, name]) => ({ code, name })).sort((a, b) =>
      a.name.localeCompare(b.name, 'ko')
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    isLoggedIn = !!user

    if (user) {
      const { data: pred } = await supabase
        .from('final_predictions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      myPrediction = (pred as FinalPrediction | null) ?? undefined
    }

    if (event) {
      const { data: allPreds } = await supabase
        .from('final_predictions')
        .select('user_id, predicted_country_name_1, predicted_country_name_2, points_earned, user_profiles(name)')

      const mapped = ((allPreds ?? []) as unknown as Array<{
        user_id: string
        predicted_country_name_1: string
        predicted_country_name_2: string
        points_earned: number | null
        user_profiles: { name: string } | { name: string }[] | null
      }>).map((row) => {
        const profile = Array.isArray(row.user_profiles) ? row.user_profiles[0] : row.user_profiles
        return {
          user_id: row.user_id,
          name: profile?.name ?? '알 수 없음',
          country_name_1: row.predicted_country_name_1,
          country_name_2: row.predicted_country_name_2,
          points_earned: row.points_earned,
        }
      })

      rankEntries = event.graded_at
        ? mapped.sort((a, b) => (b.points_earned ?? 0) - (a.points_earned ?? 0))
        : mapped.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Flag className="size-6 text-accent" />
        <h1 className="text-2xl font-bold">결승 진출국 맞추기</h1>
      </div>

      {!event ? (
        <div className="glass rounded-xl p-8 text-center text-muted-foreground">
          이벤트를 불러올 수 없습니다
        </div>
      ) : !event.is_open ? (
        <div className="glass rounded-xl p-8 text-center text-muted-foreground">
          곧 공개될 스팟 이벤트입니다. 조금만 기다려주세요!
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <p className="mb-3 text-sm text-muted-foreground">
              결승에 진출할 2개국을 예측해보세요. 마감 후에는 수정할 수 없습니다.
            </p>
            <FinalPredictionForm
              event={event}
              countries={countries}
              initialPrediction={myPrediction}
              isLoggedIn={isLoggedIn}
              isLocked={isFinalPredictionLocked(event)}
            />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">
              {event.graded_at ? '스팟 이벤트 랭킹' : '회원 예측 현황'}
            </h2>
            <FinalPredictionRanking event={event} entries={rankEntries} />
          </section>
        </div>
      )}
    </div>
  )
}
