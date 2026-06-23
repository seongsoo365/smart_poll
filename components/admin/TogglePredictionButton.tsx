'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Vote } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function TogglePredictionButton({
  matchId,
  isOpen,
}: {
  matchId: string
  isOpen: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useState(isOpen)

  async function handleToggle() {
    setOptimistic((prev) => !prev)
    const res = await fetch(`/api/admin/matches/${matchId}/toggle-prediction`, {
      method: 'POST',
    })
    if (res.ok) {
      const { match } = await res.json()
      setOptimistic(match.is_prediction_open)
      toast.success(match.is_prediction_open ? '예측이 허용되었습니다' : '예측이 닫혔습니다')
      startTransition(() => router.refresh())
    } else {
      setOptimistic((prev) => !prev)
      toast.error('변경에 실패했습니다')
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={pending}
      title={optimistic ? '예측 닫기' : '예측 열기'}
      className={cn(
        optimistic
          ? 'text-green-400 hover:bg-green-400/10 hover:text-green-300'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <Vote className="size-4" />
    </Button>
  )
}
