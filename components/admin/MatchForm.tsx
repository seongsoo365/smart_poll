'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { toast } from 'sonner'
import { ROUNDS, ROUND_LABELS, type Match } from '@/types'

function toKSTDatetimeLocal(utcString: string) {
  return new Date(utcString)
    .toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' })
    .replace(' ', 'T')
    .slice(0, 16)
}

export default function MatchForm({ match }: { match?: Match }) {
  const router = useRouter()
  const isEdit = !!match

  const [form, setForm] = useState({
    round: match?.round ?? 'group',
    group_name: match?.group_name ?? '',
    match_number: match?.match_number?.toString() ?? '1',
    home_country_name: match?.home_country_name ?? '',
    home_country_code: match?.home_country_code ?? '',
    away_country_name: match?.away_country_name ?? '',
    away_country_code: match?.away_country_code ?? '',
    kickoff_at: match?.kickoff_at ? toKSTDatetimeLocal(match.kickoff_at) : '',
    venue: match?.venue ?? '',
  })
  const [loading, setLoading] = useState(false)

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.kickoff_at) {
      toast.error('킥오프 시간을 입력해주세요')
      return
    }

    setLoading(true)
    // 입력값은 KST(+09:00) 기준 → UTC 변환
    const kickoffUtc = new Date(form.kickoff_at + ':00+09:00').toISOString()

    const payload = {
      round: form.round,
      group_name: form.round === 'group' ? (form.group_name.toUpperCase() || null) : null,
      match_number: parseInt(form.match_number) || 1,
      home_country_name: form.home_country_name,
      home_country_code: form.home_country_code.toUpperCase().slice(0, 3),
      away_country_name: form.away_country_name,
      away_country_code: form.away_country_code.toUpperCase().slice(0, 3),
      kickoff_at: kickoffUtc,
      venue: form.venue || null,
    }

    const url = isEdit ? `/api/admin/matches/${match.id}` : '/api/admin/matches'
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? '저장 실패')
      } else {
        toast.success(isEdit ? '경기를 수정했습니다' : '경기를 등록했습니다')
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
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      {/* 라운드 + 조 + 번호 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1 space-y-2">
          <Label>라운드</Label>
          <Select value={form.round} onChange={set('round')}>
            {ROUNDS.map((r) => (
              <option key={r} value={r}>
                {ROUND_LABELS[r]}
              </option>
            ))}
          </Select>
        </div>
        <div className="col-span-1 space-y-2">
          <Label>조 {form.round !== 'group' && <span className="text-muted-foreground">(해당없음)</span>}</Label>
          <Input
            placeholder="A"
            maxLength={1}
            value={form.group_name}
            onChange={set('group_name')}
            disabled={form.round !== 'group'}
          />
        </div>
        <div className="col-span-1 space-y-2">
          <Label>경기 번호</Label>
          <Input
            type="number"
            min="1"
            value={form.match_number}
            onChange={set('match_number')}
            required
          />
        </div>
      </div>

      {/* 홈팀 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>홈 팀 이름</Label>
          <Input
            placeholder="대한민국"
            value={form.home_country_name}
            onChange={set('home_country_name')}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>홈 팀 코드 (3자리)</Label>
          <Input
            placeholder="KOR"
            maxLength={3}
            value={form.home_country_code}
            onChange={set('home_country_code')}
            required
          />
        </div>
      </div>

      {/* 원정팀 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>원정 팀 이름</Label>
          <Input
            placeholder="미국"
            value={form.away_country_name}
            onChange={set('away_country_name')}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>원정 팀 코드 (3자리)</Label>
          <Input
            placeholder="USA"
            maxLength={3}
            value={form.away_country_code}
            onChange={set('away_country_code')}
            required
          />
        </div>
      </div>

      {/* 킥오프 + 경기장 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>킥오프 시간 (KST 기준)</Label>
          <Input
            type="datetime-local"
            value={form.kickoff_at}
            onChange={set('kickoff_at')}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>경기장 (선택)</Label>
          <Input
            placeholder="MetLife Stadium"
            value={form.venue}
            onChange={set('venue')}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? '저장 중...' : isEdit ? '수정하기' : '등록하기'}
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
