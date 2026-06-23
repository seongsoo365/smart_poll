import Header from '@/components/layout/Header'
import MobileBottomNav from '@/components/layout/MobileBottomNav'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <MobileBottomNav />
    </div>
  )
}
