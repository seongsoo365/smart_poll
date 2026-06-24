import Header from '@/components/layout/Header'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import NoticePopup from '@/components/notices/NoticePopup'
import { createClientSafe } from '@/lib/supabase/server'
import type { Notice } from '@/types'

async function getActiveNotice(): Promise<Notice | null> {
  const supabase = await createClientSafe()
  if (!supabase) return null

  const { data } = await supabase
    .from('notices')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (data as Notice) ?? null
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const notice = await getActiveNotice()

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <MobileBottomNav />
      {notice && <NoticePopup notice={notice} />}
    </div>
  )
}
