import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import MatchForm from '@/components/admin/MatchForm'

export default function NewMatchPage() {
  return (
    <div>
      <Link
        href="/admin/matches"
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> 경기 목록으로
      </Link>

      <h1 className="mb-6 text-2xl font-bold">경기 등록</h1>

      <MatchForm />
    </div>
  )
}
