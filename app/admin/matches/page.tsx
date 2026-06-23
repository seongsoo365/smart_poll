import Link from 'next/link'
import { createClientSafe } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import DeleteMatchButton from '@/components/admin/DeleteMatchButton'
import { Plus, Pencil, Trophy } from 'lucide-react'
import { formatKickoffKST, ROUND_LABELS, type Match } from '@/types'

export default async function AdminMatchesPage() {
  const supabase = await createClientSafe()

  let matches: Match[] = []
  const predCountMap: Record<string, number> = {}

  if (supabase) {
    const [{ data: matchData }, { data: predData }] = await Promise.all([
      supabase.from('matches').select('*').order('kickoff_at', { ascending: true }),
      supabase.from('predictions').select('match_id'),
    ])

    matches = (matchData ?? []) as Match[]

    for (const p of predData ?? []) {
      predCountMap[p.match_id] = (predCountMap[p.match_id] ?? 0) + 1
    }
  }

  const statusLabel: Record<string, { label: string; variant: 'outline' | 'secondary' | 'default' }> = {
    scheduled: { label: '예정', variant: 'outline' },
    in_progress: { label: '진행중', variant: 'default' },
    completed: { label: '완료', variant: 'secondary' },
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">경기 관리</h1>
        <Button asChild>
          <Link href="/admin/matches/new">
            <Plus className="size-4" />
            경기 등록
          </Link>
        </Button>
      </div>

      {matches.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-muted-foreground">
          등록된 경기가 없습니다
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>라운드</TableHead>
                <TableHead>대진</TableHead>
                <TableHead>킥오프 (KST)</TableHead>
                <TableHead className="text-center">상태</TableHead>
                <TableHead className="text-center">예측 수</TableHead>
                <TableHead className="text-right">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => {
                const s = statusLabel[match.status] ?? { label: match.status, variant: 'outline' as const }
                const predCount = predCountMap[match.id] ?? 0
                return (
                  <TableRow key={match.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium">{ROUND_LABELS[match.round]}</span>
                        {match.group_name && (
                          <span className="text-xs text-muted-foreground">{match.group_name}조</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {match.home_country_name}
                      </span>
                      {match.status === 'completed' ? (
                        <span className="mx-2 font-bold text-primary">
                          {match.home_score} : {match.away_score}
                        </span>
                      ) : (
                        <span className="mx-2 text-muted-foreground">vs</span>
                      )}
                      <span className="font-medium">
                        {match.away_country_name}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatKickoffKST(match.kickoff_at)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {predCount}명
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/matches/${match.id}/edit`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="text-accent hover:text-accent/80">
                          <Link href={`/admin/matches/${match.id}/result`}>
                            <Trophy className="size-4" />
                          </Link>
                        </Button>
                        <DeleteMatchButton matchId={match.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
