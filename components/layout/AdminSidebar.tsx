'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Users, Settings, ArrowLeft, BellRing, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin/matches', label: '경기 관리', icon: Calendar },
  { href: '/admin/users', label: '참가자 관리', icon: Users },
  { href: '/admin/scoring', label: '점수 규칙', icon: Settings },
  { href: '/admin/notices', label: '공지사항', icon: BellRing },
  { href: '/admin/final-prediction', label: '결승 예측 관리', icon: Flag },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden min-h-dvh w-60 flex-col border-r border-white/10 bg-background/80 backdrop-blur-sm p-4 md:flex">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          🏆 Smart Poll
        </Link>
        <p className="mt-1 text-xs text-accent">관리자</p>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              pathname.startsWith(href)
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          사이트로 돌아가기
        </Link>
      </div>
    </aside>
  )
}
