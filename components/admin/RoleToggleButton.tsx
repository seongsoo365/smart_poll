'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function RoleToggleButton({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string
  currentRole: string
  isSelf: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    const newRole = currentRole === 'system_admin' ? 'participant' : 'system_admin'
    const label = newRole === 'system_admin' ? '관리자' : '참가자'

    if (!confirm(`역할을 ${label}로 변경하시겠습니까?`)) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        toast.success(`역할이 ${label}로 변경되었습니다`)
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error ?? '변경 실패')
      }
    } catch {
      toast.error('오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">본인</span>
  }

  return (
    <Button variant="outline" size="sm" onClick={handleToggle} disabled={loading}>
      {loading
        ? '변경 중...'
        : currentRole === 'system_admin'
          ? '참가자로 변경'
          : '관리자로 변경'}
    </Button>
  )
}
