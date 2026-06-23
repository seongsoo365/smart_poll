import { createClientSafe } from '@/lib/supabase/server'
import ScoringForm from '@/components/admin/ScoringForm'
import { Settings } from 'lucide-react'
import type { ScoringRule } from '@/types'

export default async function AdminScoringPage() {
  const supabase = await createClientSafe()
  let rules: ScoringRule[] = []

  if (supabase) {
    const { data } = await supabase.from('scoring_rules').select('*')
    rules = (data ?? []) as ScoringRule[]
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <Settings className="size-6 text-primary" />
        <h1 className="text-2xl font-bold">점수 규칙 설정</h1>
      </div>
      <p className="mb-8 text-sm text-muted-foreground">
        변경한 규칙은 이후 결과 입력 시점부터 적용됩니다.
        이미 계산된 예측 점수는 재계산되지 않습니다.
      </p>

      <ScoringForm rules={rules} />
    </div>
  )
}
