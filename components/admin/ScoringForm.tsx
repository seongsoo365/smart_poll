'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { ScoringRule } from '@/types'

export default function ScoringForm({ rules }: { rules: ScoringRule[] }) {
  const winnerRule = rules.find((r) => r.rule_type === 'winner')
  const exactRule = rules.find((r) => r.rule_type === 'exact_score')

  const [winnerPts, setWinnerPts] = useState(winnerRule?.points?.toString() ?? '3')
  const [exactPts, setExactPts] = useState(exactRule?.points?.toString() ?? '7')
  const [loading, setLoading] = useState(false)

  const total = (parseInt(winnerPts) || 0) + (parseInt(exactPts) || 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/scoring', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerId: winnerRule?.id,
          exactId: exactRule?.id,
          winnerPoints: parseInt(winnerPts) || 3,
          exactPoints: parseInt(exactPts) || 7,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? '저장 실패')
      } else {
        toast.success('점수 규칙을 저장했습니다')
      }
    } catch {
      toast.error('오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>승무패 정답 점수</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={winnerPts}
            onChange={(e) => setWinnerPts(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            승무패 결과를 맞췄을 때 획득하는 점수
          </p>
        </div>
        <div className="space-y-2">
          <Label>정확한 스코어 추가 점수</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={exactPts}
            onChange={(e) => setExactPts(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            스코어까지 정확히 맞췄을 때 추가로 획득하는 점수
          </p>
        </div>
      </div>

      {/* 점수 미리보기 */}
      <div className="glass rounded-xl p-4 space-y-2 text-sm">
        <p className="font-medium text-muted-foreground mb-3">점수 구조 미리보기</p>
        <div className="flex justify-between">
          <span>승무패 정답</span>
          <span className="font-semibold text-primary">{winnerPts}점</span>
        </div>
        <div className="flex justify-between">
          <span>정확한 스코어 (승무패 포함)</span>
          <span className="font-semibold text-primary">
            {winnerPts} + {exactPts} = {total}점
          </span>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? '저장 중...' : '규칙 저장'}
      </Button>
    </form>
  )
}
