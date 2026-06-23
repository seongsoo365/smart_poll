import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWinnerFromScore, type PredictedWinner } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const body = await request.json()
  const { matchId, predictedWinner, predictedHomeScore, predictedAwayScore } = body as {
    matchId: string
    predictedWinner: PredictedWinner
    predictedHomeScore: number
    predictedAwayScore: number
  }

  if (!matchId || !predictedWinner) {
    return NextResponse.json({ error: '필수 값이 누락되었습니다' }, { status: 400 })
  }

  if (!['home', 'draw', 'away'].includes(predictedWinner)) {
    return NextResponse.json({ error: '잘못된 예측값입니다' }, { status: 400 })
  }

  const homeScore = Math.max(0, Math.floor(predictedHomeScore ?? 0))
  const awayScore = Math.max(0, Math.floor(predictedAwayScore ?? 0))

  // 스코어와 승무패 일치 확인
  const impliedWinner = getWinnerFromScore(homeScore, awayScore)
  if (impliedWinner !== predictedWinner) {
    return NextResponse.json(
      { error: '스코어와 승무패 예측이 일치하지 않습니다' },
      { status: 400 }
    )
  }

  // 경기 존재 및 마감 여부 확인
  const { data: match } = await supabase
    .from('matches')
    .select('id, status, prediction_locked_at, kickoff_at')
    .eq('id', matchId)
    .single()

  if (!match) {
    return NextResponse.json({ error: '경기를 찾을 수 없습니다' }, { status: 404 })
  }

  if (match.status === 'completed') {
    return NextResponse.json({ error: '이미 완료된 경기입니다' }, { status: 400 })
  }

  // 마감 시간 계산 (prediction_locked_at 없으면 kickoff - 1시간)
  const lockTime = match.prediction_locked_at
    ? new Date(match.prediction_locked_at)
    : new Date(new Date(match.kickoff_at).getTime() - 3600000)

  if (lockTime <= new Date()) {
    return NextResponse.json({ error: '예측 마감 시간이 지났습니다' }, { status: 400 })
  }

  // 예측 upsert
  const { data, error } = await supabase
    .from('predictions')
    .upsert(
      {
        user_id: user.id,
        match_id: matchId,
        predicted_winner: predictedWinner,
        predicted_home_score: homeScore,
        predicted_away_score: awayScore,
      },
      { onConflict: 'user_id,match_id' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ prediction: data })
}
