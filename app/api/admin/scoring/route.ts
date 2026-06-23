import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PUT /api/admin/scoring — 점수 규칙 수정
export async function PUT(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'system_admin') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { winnerId, exactId, winnerPoints, exactPoints } = await request.json() as {
    winnerId?: string
    exactId?: string
    winnerPoints: number
    exactPoints: number
  }

  const updates = []

  if (winnerId) {
    updates.push(
      supabase.from('scoring_rules').update({ points: winnerPoints }).eq('id', winnerId)
    )
  } else {
    updates.push(
      supabase.from('scoring_rules').upsert(
        { rule_type: 'winner', points: winnerPoints, is_active: true },
        { onConflict: 'rule_type' }
      )
    )
  }

  if (exactId) {
    updates.push(
      supabase.from('scoring_rules').update({ points: exactPoints }).eq('id', exactId)
    )
  } else {
    updates.push(
      supabase.from('scoring_rules').upsert(
        { rule_type: 'exact_score', points: exactPoints, is_active: true },
        { onConflict: 'rule_type' }
      )
    )
  }

  const results = await Promise.all(updates)
  const err = results.find((r) => r.error)
  if (err?.error) return NextResponse.json({ error: err.error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
