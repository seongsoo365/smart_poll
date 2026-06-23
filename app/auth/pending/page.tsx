import Link from 'next/link'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClientSafe } from '@/lib/supabase/server'

export default async function PendingPage() {
  const supabase = await createClientSafe()
  let email = ''
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser()
    email = user?.email ?? ''
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass w-full max-w-sm rounded-2xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
          <Clock className="h-8 w-8 text-amber-400" />
        </div>
        <h1 className="text-xl font-bold">승인 대기 중</h1>
        {email && (
          <p className="mt-2 text-xs text-muted-foreground break-all">{email}</p>
        )}
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          로그인이 완료되었습니다.<br />
          관리자 승인 후 예측 게임에 참여하실 수 있습니다.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/matches">경기 일정 보기</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
            <Link href="/auth/login">다른 계정으로 로그인</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
