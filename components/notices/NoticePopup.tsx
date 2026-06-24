'use client'

import { useEffect, useState } from 'react'
import { X, BellRing } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Notice } from '@/types'

const STORAGE_KEY = 'notice_dismissed_until'

export default function NoticePopup({ notice }: { notice: Notice }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const until = localStorage.getItem(STORAGE_KEY)
    if (!until || new Date(until) < new Date()) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  function dismiss() {
    setVisible(false)
  }

  function dismissForWeek() {
    const until = new Date()
    until.setDate(until.getDate() + 7)
    localStorage.setItem(STORAGE_KEY, until.toISOString())
    setVisible(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* 팝업 */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-background shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <BellRing className="size-5 text-primary" />
            <span className="font-semibold">공지사항</span>
          </div>
          <button
            onClick={dismiss}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* 본문 */}
        <div className="px-5 py-4">
          <h2 className="mb-3 text-lg font-bold">{notice.title}</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {notice.content}
          </p>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
          <button
            onClick={dismissForWeek}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            일주일간 보지 않기
          </button>
          <Button size="sm" onClick={dismiss}>
            확인
          </Button>
        </div>
      </div>
    </div>
  )
}
