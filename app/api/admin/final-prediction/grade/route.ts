import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'system_admin' ? user : null
}

// POST /api/admin/final-prediction/grade — 실제 결승 진출국 입력 + 자동 채점
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { countryCode1, countryName1, countryCode2, countryName2 } = await request.json() as {
    countryCode1: string
    countryName1: string
    countryCode2: string
    countryName2: string
  }

  if (!countryCode1 || !countryName1 || !countryCode2 || !countryName2) {
    return NextResponse.json({ error: '결승 진출국 2개를 모두 입력해주세요' }, { status: 400 })
  }

  if (countryCode1 === countryCode2) {
    return NextResponse.json({ error: '서로 다른 두 국가를 입력해주세요' }, { status: 400 })
  }

  // 1. 이벤트에 실제 결과 기록
  const { data: event } = await supabase
    .from('final_prediction_event')
    .select('id, points_one_correct, points_both_correct')
    .single()

  if (!event) {
    return NextResponse.json({ error: '이벤트를 찾을 수 없습니다' }, { status: 404 })
  }

  const { error: eventError } = await supabase
    .from('final_prediction_event')
    .update({
      actual_country_code_1: countryCode1,
      actual_country_name_1: countryName1,
      actual_country_code_2: countryCode2,
      actual_country_name_2: countryName2,
      graded_at: new Date().toISOString(),
    })
    .eq('id', event.id)

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 })
  }

  // 2. 전체 예측 조회
  const { data: predictions } = await supabase
    .from('final_predictions')
    .select('id, predicted_country_code_1, predicted_country_code_2')

  if (!predictions || predictions.length === 0) {
    return NextResponse.json({ success: true, updatedCount: 0 })
  }

  const actualSet = new Set([countryCode1, countryCode2])

  // 3. 각 예측의 적중 개수 계산 후 병렬 업데이트
  const updates = predictions.map((pred) => {
    const matchCount = [pred.predicted_country_code_1, pred.predicted_country_code_2].filter(
      (code) => actualSet.has(code)
    ).length

    const pts =
      matchCount === 2
        ? event.points_both_correct
        : matchCount === 1
          ? event.points_one_correct
          : 0

    return supabase
      .from('final_predictions')
      .update({ points_earned: pts })
      .eq('id', pred.id)
  })

  await Promise.all(updates)

  return NextResponse.json({ success: true, updatedCount: predictions.length })
}
