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

// PUT /api/admin/final-prediction — 결승 진출국 예측 이벤트 설정 수정
export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { lockAt, isOpen, pointsOneCorrect, pointsBothCorrect } = await request.json() as {
    lockAt: string
    isOpen: boolean
    pointsOneCorrect: number
    pointsBothCorrect: number
  }

  if (!lockAt) {
    return NextResponse.json({ error: '마감 시각을 입력해주세요' }, { status: 400 })
  }

  const { data: event } = await supabase
    .from('final_prediction_event')
    .select('id')
    .single()

  if (!event) {
    return NextResponse.json({ error: '이벤트를 찾을 수 없습니다' }, { status: 404 })
  }

  const { error } = await supabase
    .from('final_prediction_event')
    .update({
      lock_at: lockAt,
      is_open: isOpen,
      points_one_correct: pointsOneCorrect,
      points_both_correct: pointsBothCorrect,
    })
    .eq('id', event.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
