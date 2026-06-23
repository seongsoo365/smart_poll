import Link from 'next/link'
import { createClientSafe } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import LogoutButton from './LogoutButton'

export default async function Header() {
  const supabase = await createClientSafe()
  let userName: string | null = null
  let isAdmin = false

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('name, role')
        .eq('id', user.id)
        .single()

      userName = profile?.name ?? user.email ?? null
      isAdmin = profile?.role === 'system_admin'
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          🏆 <span>Smart Poll</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link
            href="/matches"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            경기 일정
          </Link>
          <Link
            href="/rankings"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            순위
          </Link>
          {userName && (
            <Link
              href="/my-predictions"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              내 예측
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin/matches"
              className="text-accent transition-colors hover:text-accent/80"
            >
              관리자
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {userName ? (
            <>
              <span className="hidden text-sm text-muted-foreground md:block">{userName}</span>
              <LogoutButton />
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/login">로그인</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
