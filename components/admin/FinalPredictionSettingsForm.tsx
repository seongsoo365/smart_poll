'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { FinalPredictionEvent } from '@/types'

function toKSTDatetimeLocal(utcString: string) {
  return new Date(utcString)
    .toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' })
    .replace(' ', 'T')
    .slice(0, 16)
}

export default function FinalPredictionSettingsForm({ event }: { event: FinalPredictionEvent }) {
  const router = useRouter()
  const [lockAt, setLockAt] = useState(toKSTDatetimeLocal(event.lock_at))
  const [isOpen, setIsOpen] = useState(event.is_open)
  const [pointsOneCorrect, setPointsOneCorrect] = useState(event.points_one_correct.toString())
  const [pointsBothCorrect, setPointsBothCorrect] = useState(event.points_both_correct.toString())
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!lockAt) {
      toast.error('마감 시각을 입력해주세요')
      return
    }

    setLoading(true)
    const lockAtUtc = new Date(lockAt + ':00+09:00').toISOString()

    try {
      const res = await fetch('/api/admin/final-prediction', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lockAt: lockAtUtc,
          isOpen,
          pointsOneCorrect: parseInt(pointsOneCorrect) || 0,
          pointsBothCorrect: parseInt(pointsBothCorrect) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? '저장 실패')
      } else {
        toast.success('이벤트 설정을 저장했습니다')
        router.refresh()
      }
    } catch {
      toast.error('오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-5">
      <div className="space-y-2">
        <Label>예측 마감 시각 (KST 기준)</Label>
        <Input
          type="datetime-local"
          value={lockAt}
          onChange={(e) => setLockAt(e.target.value)}
          required
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isOpen}
          onChange={(e) => setIsOpen(e.target.checked)}
          className="size-4 rounded border-white/20"
        />
        참가자에게 이벤트 공개
      </label>

      <div className="space-y-2">
        <Label>1개국만 적중 시 점수</Label>
        <Input
          type="number"
          min="0"
          max="100"
          value={pointsOneCorrect}
          onChange={(e) => setPointsOneCorrect(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>2개국 모두 적중 시 점수</Label>
        <Input
          type="number"
          min="0"
          max="100"
          value={pointsBothCorrect}
          onChange={(e) => setPointsBothCorrect(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? '저장 중...' : '설정 저장'}
      </Button>
    </form>
  )
}
