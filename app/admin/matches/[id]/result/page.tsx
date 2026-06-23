import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClientSafe } from '@/lib/supabase/server'
import ResultForm from '@/components/admin/ResultForm'
import type { Match } from '@/types'

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClientSafe()
  if (!supabase) notFound()

  const [{ data: matchData }, { count }] = await Promise.all([
    supabase.from('matches').select('*').eq('id', id).single(),
    supabase.from('predictions').select('*', { count: 'exact', head: true }).eq('match_id', id),
  ])

  if (!matchData) notFound()

  return (
    <div>
      <Link
        href="/admin/matches"
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> 경기 목록으로
      </Link>

      <h1 className="mb-6 text-2xl font-bold">결과 입력</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        결과를 저장하면 모든 참가자의 예측 점수가 자동으로 계산됩니다.
      </p>

      <ResultForm match={matchData as Match} predictionCount={count ?? 0} />
    </div>
  )
}
