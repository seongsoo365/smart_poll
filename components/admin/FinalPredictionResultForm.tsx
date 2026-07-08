'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { toast } from 'sonner'
import type { CountryOption, FinalPredictionEvent } from '@/types'

export default function FinalPredictionResultForm({
  event,
  countries,
  predictionCount,
}: {
  event: FinalPredictionEvent
  countries: CountryOption[]
  predictionCount: number
}) {
  const router = useRouter()
  const [code1, setCode1] = useState(event.actual_country_code_1 ?? '')
  const [code2, setCode2] = useState(event.actual_country_code_2 ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!code1 || !code2) {
      toast.error('결승 진출국 2개를 모두 선택해주세요')
      return
    }
    if (code1 === code2) {
      toast.error('서로 다른 두 국가를 선택해주세요')
      return
    }

    const country1 = countries.find((c) => c.code === code1)
    const country2 = countries.find((c) => c.code === code2)
    if (!country1 || !country2) return

    if (
      !confirm(
        `결과를 저장하면 ${predictionCount}개의 예측 점수가 자동 계산됩니다.\n계속하시겠습니까?`
      )
    )
      return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/final-prediction/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode1: country1.code,
          countryName1: country1.name,
          countryCode2: country2.code,
          countryName2: country2.name,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? '저장 실패')
      } else {
        toast.success(`채점 완료! ${data.updatedCount}개 예측 점수가 계산되었습니다`)
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
      <div className="glass rounded-xl p-5 text-center">
        <p className="text-sm text-muted-foreground">{predictionCount}명이 제출한 예측</p>
        {event.graded_at && (
          <p className="mt-2 text-sm text-accent">
            이미 채점된 이벤트입니다 (재채점 시 점수가 다시 계산됩니다)
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>실제 결승 진출국 1</Label>
        <Select value={code1} onChange={(e) => setCode1(e.target.value)}>
          <option value="">국가 선택</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label>실제 결승 진출국 2</Label>
        <Select value={code2} onChange={(e) => setCode2(e.target.value)}>
          <option value="">국가 선택</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? '계산 중...' : '결과 저장 및 점수 계산'}
      </Button>
    </form>
  )
}
