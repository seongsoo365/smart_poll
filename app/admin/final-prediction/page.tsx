import { createClientSafe } from '@/lib/supabase/server'
import { Flag } from 'lucide-react'
import type { CountryOption, FinalPredictionEvent, Match } from '@/types'
import FinalPredictionSettingsForm from '@/components/admin/FinalPredictionSettingsForm'
import FinalPredictionResultForm from '@/components/admin/FinalPredictionResultForm'

export default async function AdminFinalPredictionPage() {
  const supabase = await createClientSafe()
  let event: FinalPredictionEvent | null = null
  let countries: CountryOption[] = []
  let predictionCount = 0

  if (supabase) {
    const [{ data: eventData }, { data: matchData }, { count }] = await Promise.all([
      supabase.from('final_prediction_event').select('*').single(),
      supabase.from('matches').select('home_country_code, home_country_name, away_country_code, away_country_name'),
      supabase.from('final_predictions').select('*', { count: 'exact', head: true }),
    ])

    event = eventData as FinalPredictionEvent | null
    predictionCount = count ?? 0

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
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <Flag className="size-6 text-primary" />
        <h1 className="text-2xl font-bold">결승 진출국 맞추기 관리</h1>
      </div>
      <p className="mb-8 text-sm text-muted-foreground">
        참가자가 결승 진출국 2개를 예측하는 스팟 이벤트입니다. 종합 순위표와는 별도로 채점됩니다.
      </p>

      {!event ? (
        <p className="text-muted-foreground">이벤트를 불러올 수 없습니다</p>
      ) : (
        <div className="grid gap-10 md:grid-cols-2">
          <section>
            <h2 className="mb-4 text-lg font-semibold">이벤트 설정</h2>
            <FinalPredictionSettingsForm event={event} />
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold">결과 입력 및 채점</h2>
            <FinalPredictionResultForm
              event={event}
              countries={countries}
              predictionCount={predictionCount}
            />
          </section>
        </div>
      )}
    </div>
  )
}
