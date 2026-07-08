'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { toast } from 'sonner'
import { type CountryOption, type FinalPrediction, type FinalPredictionEvent } from '@/types'

type Props = {
  event: FinalPredictionEvent
  countries: CountryOption[]
  initialPrediction?: FinalPrediction
  isLoggedIn: boolean
  isLocked: boolean
}

export default function FinalPredictionForm({
  event,
  countries,
  initialPrediction,
  isLoggedIn,
  isLocked,
}: Props) {
  const [code1, setCode1] = useState(initialPrediction?.predicted_country_code_1 ?? '')
  const [code2, setCode2] = useState(initialPrediction?.predicted_country_code_2 ?? '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(!!initialPrediction)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!code1 || !code2) {
      toast.error('국가 2개를 모두 선택해주세요')
      return
    }
    if (code1 === code2) {
      toast.error('서로 다른 두 국가를 선택해주세요')
      return
    }

    const country1 = countries.find((c) => c.code === code1)
    const country2 = countries.find((c) => c.code === code2)
    if (!country1 || !country2) return

    setLoading(true)
    try {
      const res = await fetch('/api/final-predictions', {
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
        <p className="mt-1 text-sm text-muted-foreground">결승 진출국 예측이 마감되었습니다</p>
        {initialPrediction && (
          <div className="mt-3 rounded-lg bg-white/5 p-3 text-sm">
            내 예측:{' '}
            <span className="font-semibold text-accent">
              {initialPrediction.predicted_country_name_1} / {initialPrediction.predicted_country_name_2}
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-xl p-6 space-y-5">
      <div>
        <p className="mb-3 text-sm font-medium text-muted-foreground">결승 진출국 2개 선택</p>
        <div className="grid grid-cols-2 gap-3">
          <Select value={code1} onChange={(e) => setCode1(e.target.value)}>
            <option value="">국가 1 선택</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={code2} onChange={(e) => setCode2(e.target.value)}>
            <option value="">국가 2 선택</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-center text-sm">
        <p className="text-xs text-muted-foreground">
          1개국만 적중 시 {event.points_one_correct}점, 2개국 모두 적중 시{' '}
          <span className="font-semibold text-foreground">{event.points_both_correct}점</span>
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? '저장 중...' : saved ? '예측 수정하기' : '예측 저장하기'}
      </Button>

      {saved && (
        <p className="text-center text-xs text-green-400">✅ 저장된 예측 — 마감 전 수정 가능</p>
      )}
    </form>
  )
}
