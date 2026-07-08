import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isFinalPredictionLocked } from '@/types'

// POST /api/final-predictions — 결승 진출국 예측 제출/수정
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  // 승인 여부 확인
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_approved')
    .eq('id', user.id)
    .single()

  if (!profile?.is_approved) {
    return NextResponse.json({ error: '관리자 승인 후 예측이 가능합니다' }, { status: 403 })
  }

  const body = await request.json()
  const { countryCode1, countryName1, countryCode2, countryName2 } = body as {
    countryCode1: string
    countryName1: string
    countryCode2: string
    countryName2: string
  }

  if (!countryCode1 || !countryName1 || !countryCode2 || !countryName2) {
    return NextResponse.json({ error: '필수 값이 누락되었습니다' }, { status: 400 })
  }

  if (countryCode1 === countryCode2) {
    return NextResponse.json({ error: '서로 다른 두 국가를 선택해주세요' }, { status: 400 })
  }

  // 이벤트 설정 조회 (공개 여부 및 마감 시간 확인)
  const { data: event } = await supabase
    .from('final_prediction_event')
    .select('lock_at, is_open')
    .single()

  if (!event) {
    return NextResponse.json({ error: '이벤트를 찾을 수 없습니다' }, { status: 404 })
  }

  if (!event.is_open) {
    return NextResponse.json({ error: '아직 공개되지 않은 이벤트입니다' }, { status: 403 })
  }

  if (isFinalPredictionLocked(event)) {
    return NextResponse.json({ error: '예측 마감 시간이 지났습니다' }, { status: 400 })
  }

  // 예측 upsert
  const { data, error } = await supabase
    .from('final_predictions')
    .upsert(
      {
        user_id: user.id,
        predicted_country_code_1: countryCode1,
        predicted_country_name_1: countryName1,
        predicted_country_code_2: countryCode2,
        predicted_country_name_2: countryName2,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ prediction: data })
}
