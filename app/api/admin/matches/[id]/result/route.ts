import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWinnerFromScore } from '@/types'

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

// POST /api/admin/matches/[id]/result — 결과 입력 + 점수 자동 계산
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { id } = await params
  const { homeScore, awayScore } = await request.json() as {
    homeScore: number
    awayScore: number
  }

  if (homeScore === undefined || awayScore === undefined) {
    return NextResponse.json({ error: '스코어를 입력해주세요' }, { status: 400 })
  }

  const home = Math.max(0, Math.floor(homeScore))
  const away = Math.max(0, Math.floor(awayScore))
  const actualWinner = getWinnerFromScore(home, away)

  // 1. 경기 결과 업데이트
  const { error: matchError } = await supabase
    .from('matches')
    .update({ home_score: home, away_score: away, status: 'completed' })
    .eq('id', id)

  if (matchError) {
    return NextResponse.json({ error: matchError.message }, { status: 500 })
  }

  // 2. 점수 규칙 조회
  const { data: rules } = await supabase
    .from('scoring_rules')
    .select('rule_type, points')
    .eq('is_active', true)

  const winnerPts = (rules ?? []).find((r) => r.rule_type === 'winner')?.points ?? 3
  const exactPts = (rules ?? []).find((r) => r.rule_type === 'exact_score')?.points ?? 7

  // 3. 해당 경기 예측 전체 조회
  const { data: predictions } = await supabase
    .from('predictions')
    .select('id, predicted_winner, predicted_home_score, predicted_away_score')
    .eq('match_id', id)

  if (!predictions || predictions.length === 0) {
    return NextResponse.json({ success: true, updatedCount: 0 })
  }

  // 4. 각 예측 점수 계산 후 병렬 업데이트
  const updates = predictions.map((pred) => {
    let pts = 0
    if (pred.predicted_winner === actualWinner) {
      pts += winnerPts
      if (pred.predicted_home_score === home && pred.predicted_away_score === away) {
        pts += exactPts
      }
    }
    return supabase
      .from('predictions')
      .update({ points_earned: pts })
      .eq('id', pred.id)
  })

  await Promise.all(updates)

  return NextResponse.json({ success: true, updatedCount: predictions.length })
}
