'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { getWinnerFromScore, type Match } from '@/types'

export default function ResultForm({
  match,
  predictionCount,
}: {
  match: Match
  predictionCount: number
}) {
  const router = useRouter()
  const [homeScore, setHomeScore] = useState(match.home_score?.toString() ?? '0')
  const [awayScore, setAwayScore] = useState(match.away_score?.toString() ?? '0')
  const [loading, setLoading] = useState(false)

  const homeNum = Math.max(0, parseInt(homeScore) || 0)
  const awayNum = Math.max(0, parseInt(awayScore) || 0)
  const winner = getWinnerFromScore(homeNum, awayNum)
  const winnerLabel =
    winner === 'home'
      ? `${match.home_country_name} 승`
      : winner === 'away'
        ? `${match.away_country_name} 승`
        : '무승부'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (
      !confirm(
        `결과를 저장하면 ${predictionCount}개의 예측 점수가 자동 계산됩니다.\n계속하시겠습니까?`
      )
    )
      return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/matches/${match.id}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeScore: homeNum, awayScore: awayNum }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? '저장 실패')
      } else {
        toast.success(
          `결과 저장 완료! ${data.updatedCount}개 예측 점수가 계산되었습니다`
        )
        router.push('/admin/matches')
        router.refresh()
      }
    } catch {
      toast.error('오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-6">
      {/* 경기 정보 */}
      <div className="glass rounded-xl p-5 text-center">
        <p className="text-xl font-bold">
          {match.home_country_name} vs {match.away_country_name}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{predictionCount}명이 예측한 경기</p>
        {match.status === 'completed' && (
          <p className="mt-2 text-sm text-accent">이미 결과가 입력된 경기입니다 (재계산 가능)</p>
        )}
      </div>

      {/* 스코어 입력 */}
      <div className="flex items-end justify-center gap-6">
        <div className="text-center">
          <Label className="mb-2 block">{match.home_country_name}</Label>
          <Input
            type="number"
            min="0"
            max="99"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            className="w-20 text-center text-3xl font-bold"
          />
        </div>
        <span className="mb-2 text-4xl font-bold text-muted-foreground">:</span>
        <div className="text-center">
          <Label className="mb-2 block">{match.away_country_name}</Label>
          <Input
            type="number"
            min="0"
            max="99"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            className="w-20 text-center text-3xl font-bold"
          />
        </div>
      </div>

      {/* 판정 표시 */}
      <div className="glass rounded-lg p-3 text-center text-sm">
        판정:{' '}
        <span className="font-semibold text-primary">{winnerLabel}</span>
      </div>

      <div className="flex gap-3">
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? '계산 중...' : '결과 저장 및 점수 계산'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/admin/matches')}
        >
          취소
        </Button>
      </div>
    </form>
  )
}
