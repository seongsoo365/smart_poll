import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClientSafe } from '@/lib/supabase/server'
import MatchForm from '@/components/admin/MatchForm'
import type { Match } from '@/types'

export default async function EditMatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClientSafe()
  if (!supabase) notFound()

  const { data } = await supabase.from('matches').select('*').eq('id', id).single()
  if (!data) notFound()

  return (
    <div>
      <Link
        href="/admin/matches"
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> 경기 목록으로
      </Link>

      <h1 className="mb-6 text-2xl font-bold">경기 수정</h1>

      <MatchForm match={data as Match} />
    </div>
  )
}
