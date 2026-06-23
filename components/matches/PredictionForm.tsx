'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getWinnerFromScore, type Match, type Prediction, type ScoringRules } from '@/types'

type Props = {
  match: Match
  initialPrediction?: Prediction
  isLoggedIn: boolean
  isLocked: boolean
  scoringRules: ScoringRules
}

export default function PredictionForm({
  match,
  initialPrediction,
  isLoggedIn,
  isLocked,
  scoringRules,
}: Props) {
  const [homeScore, setHomeScore] = useState(
    initialPrediction?.predicted_home_score?.toString() ?? '0'
  )
  const [awayScore, setAwayScore] = useState(
    initialPrediction?.predicted_away_score?.toString() ?? '0'
  )
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(!!initialPrediction)

  const homeNum = Math.max(0, parseInt(homeScore) || 0)
  const awayNum = Math.max(0, parseInt(awayScore) || 0)
  const impliedWinner = getWinnerFromScore(homeNum, awayNum)

  const winnerLabel =
    impliedWinner === 'home'
      ? `${match.home_country_name} 승`
      : impliedWinner === 'away'
        ? `${match.away_country_name} 승`
        : '무승부'

  // 정확한 스코어로 최대 점수
  const maxPoints = scoringRules.winner + scoringRules.exact_score

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          predictedWinner: impliedWinner,
          predictedHomeScore: homeNum,
          predictedAwayScore: awayNum,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? '저장에 실패했습니다')
      } else {
        toast.success(initialPrediction ? '예측을 수정했습니다' : '예측을 저장했습니다!')
        setSaved(true)
      }
    } catch {
      toast.error('오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <p className="mb-3 text-muted-foreground">예측에 참여하려면 로그인이 필요합니다</p>
        <Button asChild>
          <Link href="/auth/login">로그인하기</Link>
        </Button>
      </div>
    )
  }

  if (isLocked) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <p className="text-lg">🔒 예측 마감</p>
        <p className="mt-1 text-sm text-muted-foreground">킥오프 1시간 전 예측이 마감되었습니다</p>
        {initialPrediction && (
          <div className="mt-3 rounded-lg bg-white/5 p-3 text-sm">
            내 예측:{' '}
            <span className="font-semibold text-accent">
              {match.home_country_name} {initialPrediction.predicted_home_score} : {initialPrediction.predicted_away_score} {match.away_country_name}
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-xl p-6 space-y-5">
      {/* 스코어 입력 */}
      <div>
        <p className="mb-3 text-sm font-medium text-muted-foreground">스코어 예측</p>
        <div className="flex items-end justify-center gap-4">
          <div className="text-center">
            <p className="mb-1 text-xs text-muted-foreground">{match.home_country_name}</p>
            <Input
              type="number"
              min="0"
              max="99"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              className="w-16 text-center text-xl font-bold"
            />
          </div>
          <span className="mb-2 text-2xl font-bold text-muted-foreground">:</span>
          <div className="text-center">
            <p className="mb-1 text-xs text-muted-foreground">{match.away_country_name}</p>
            <Input
              type="number"
              min="0"
              max="99"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              className="w-16 text-center text-xl font-bold"
            />
          </div>
        </div>
      </div>

      {/* 예측 결과 + 예상 점수 */}
      <div className={cn(
        'rounded-lg p-3 text-center text-sm',
        'bg-primary/10 border border-primary/20'
      )}>
        <p className="font-semibold text-primary">{winnerLabel}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          최대 획득 점수: 승무패 {scoringRules.winner}점 + 정확한 스코어 {scoringRules.exact_score}점 ={' '}
          <span className="font-semibold text-foreground">{maxPoints}점</span>
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? '저장 중...'
          : saved
            ? '예측 수정하기'
            : '예측 저장하기'}
      </Button>

      {saved && (
        <p className="text-center text-xs text-green-400">✅ 저장된 예측 — 마감 전 수정 가능</p>
      )}
    </form>
  )
}
