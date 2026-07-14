'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TOURNAMENT_START, TOURNAMENT_END } from '@/types'

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00Z')
  const month = d.getUTCMonth() + 1
  const day = d.getUTCDate()
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const weekday = weekdays[d.getUTCDay()]
  return { md: `${month}/${day}`, weekday }
}

export default function DateNav({ selected }: { selected: string }) {
  const router = useRouter()

  const prev = addDays(selected, -1)
  const next = addDays(selected, 1)
  const canPrev = prev >= TOURNAMENT_START
  const canNext = next <= TOURNAMENT_END

  // 선택일 기준 앞뒤 3일씩 (최대 7개) 날짜 스트립
  const strip: string[] = []
  for (let i = -3; i <= 3; i++) {
    const d = addDays(selected, i)
    if (d >= TOURNAMENT_START && d <= TOURNAMENT_END) strip.push(d)
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => router.push(`/?date=${prev}`)}
        disabled={!canPrev}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 disabled:opacity-30"
      >
        <ChevronLeft className="size-4" />
      </button>

      <div className="flex flex-1 gap-1 overflow-x-auto scrollbar-none">
        {strip.map((date) => {
          const { md, weekday } = formatDay(date)
          const isSelected = date === selected
          const isToday = date === new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10)
          return (
            <button
              key={date}
              onClick={() => router.push(`/?date=${date}`)}
              className={cn(
                'flex min-w-[52px] flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-xs transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-white/10'
              )}
            >
              <span className={cn('font-semibold', isToday && !isSelected && 'text-accent')}>
                {md}
              </span>
              <span className="opacity-70">{weekday}</span>
            </button>
          )
        })}
      </div>

      <button
        onClick={() => router.push(`/?date=${next}`)}
        disabled={!canNext}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 disabled:opacity-30"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}
