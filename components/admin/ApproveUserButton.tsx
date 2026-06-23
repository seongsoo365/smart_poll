'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  userId: string
  isApproved: boolean
}

export default function ApproveUserButton({ userId, isApproved }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: !isApproved }),
      })
      if (!res.ok) {
        const data = await res.json() as { error: string }
        toast.error(data.error || '처리 실패')
        return
      }
      toast.success(isApproved ? '승인이 취소되었습니다' : '사용자를 승인했습니다')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      disabled={loading}
      className={
        isApproved
          ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10'
          : 'text-green-400 hover:text-green-300 hover:bg-green-400/10'
      }
    >
      {loading ? (
        <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : isApproved ? (
        <>
          <XCircle className="size-4" />
          취소
        </>
      ) : (
        <>
          <CheckCircle className="size-4" />
          승인
        </>
      )}
    </Button>
  )
}
