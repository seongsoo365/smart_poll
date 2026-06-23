'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function DeleteMatchButton({ matchId }: { matchId: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (
      !confirm('경기를 삭제하면 해당 경기의 모든 예측 데이터도 삭제됩니다.\n계속하시겠습니까?')
    )
      return

    const res = await fetch(`/api/admin/matches/${matchId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('경기가 삭제되었습니다')
      router.refresh()
    } else {
      toast.error('삭제에 실패했습니다')
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      className="text-red-400 hover:bg-red-400/10 hover:text-red-300"
    >
      <Trash2 className="size-4" />
    </Button>
  )
}
