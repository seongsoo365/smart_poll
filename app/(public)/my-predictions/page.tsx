import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClientSafe } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { User, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatKickoffKST, ROUND_LABELS, type Match, type Prediction } from '@/types'

type PredictionWithMatch = Prediction & { match: Match }

export default async function MyPredictionsPage() {
  const supabase = await createClientSafe()

  if (!supabase) redirect('/auth/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // 미승인 사용자는 대기 페이지로
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_approved')
    .eq('id', user.id)
    .single()

  if (!profile?.is_approved) redirect('/auth/pending')

  const { data: predsRaw } = await supabase
    .from('predictions')
    .select('*, match:matches(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const predictions = (predsRaw ?? []) as PredictionWithMatch[]

  // 통계 계산
  const totalPredicted = predictions.length
  const completed = predictions.filter((p) => p.points_earned !== null)
  const correct = completed.filter((p) => (p.points_earned ?? 0) >= 3)
  const exact = completed.filter((p) => (p.points_earned ?? 0) >= 10)
  const totalPoints = completed.reduce((sum, p) => sum + (p.points_earned ?? 0), 0)

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <User className="size-6 text-primary" />
        <h1 className="text-2xl font-bold">내 예측</h1>
      </div>

      {/* 요약 카드 */}
      {totalPredicted > 0 && (
        <div className="glass mb-6 grid grid-cols-4 gap-4 rounded-xl p-4">
          {[
            { label: '예측', value: totalPredicted, unit: '경기' },
            { label: '정답', value: correct.length, unit: '개' },
            { label: '정확', value: exact.length, unit: '개' },
            { label: '총점', value: totalPoints, unit: '점' },
          ].map(({ label, value, unit }) => (
            <div key={label} className="text-center">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold text-primary">
                {value}
                <span className="text-xs font-normal text-muted-foreground">{unit}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 예측 목록 */}
      {predictions.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-muted-foreground">
          <p className="mb-3">아직 예측한 경기가 없습니다</p>
          <Link href="/matches" className="text-primary hover:underline">
            경기 목록 보기 →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {predictions.map((pred) => {
            const match = pred.match
            const isCompleted = match.status === 'completed'
            const pts = pred.points_earned ?? 0
            const isPending = pred.points_earned === null

            return (
              <Link key={pred.id} href={`/matches/${match.id}`}>
                <div
                  className={cn(
                    'glass rounded-xl p-4 transition-all hover:border-primary/40',
                    isCompleted && pts >= 3 && 'border-green-500/20',
                    isCompleted && pts === 0 && 'border-red-500/20'
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {ROUND_LABELS[match.round]}
                        {match.group_name ? ` ${match.group_name}조` : ''}
                      </Badge>
                      {isCompleted ? (
                        <Badge variant="secondary" className="text-xs">완료</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">예정</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatKickoffKST(match.kickoff_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {match.home_country_name} vs {match.away_country_name}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        내 예측:{' '}
                        <span className="text-foreground">
                          {pred.predicted_home_score} : {pred.predicted_away_score}
                        </span>
                      </p>
                      {isCompleted && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          실제:{' '}
                          <span className="text-foreground">
                            {match.home_score} : {match.away_score}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      {isPending ? (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="size-4" /> 대기
                        </span>
                      ) : pts >= 3 ? (
                        <span className="flex items-center gap-1 text-lg font-bold text-green-400">
                          <CheckCircle2 className="size-5" />
                          +{pts}점
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-lg font-bold text-red-400">
                          <XCircle className="size-5" />
                          0점
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
