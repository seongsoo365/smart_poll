import { createClientSafe } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import RoleToggleButton from '@/components/admin/RoleToggleButton'
import ApproveUserButton from '@/components/admin/ApproveUserButton'
import { Users } from 'lucide-react'
import type { UserProfile } from '@/types'

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  kakao: '카카오',
  email: '이메일',
}

export default async function AdminUsersPage() {
  const supabase = await createClientSafe()

  let users: UserProfile[] = []
  let currentUserId = ''

  if (supabase) {
    const [{ data: { user } }, { data: profiles }] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false }),
    ])

    currentUserId = user?.id ?? ''
    users = (profiles ?? []) as UserProfile[]
  }

  const pending = users.filter((u) => !u.is_approved)
  const approved = users.filter((u) => u.is_approved)

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Users className="size-6 text-primary" />
        <h1 className="text-2xl font-bold">참가자 관리</h1>
        <span className="text-sm text-muted-foreground">
          전체 {users.length}명 · 대기 {pending.length}명
        </span>
      </div>

      {/* 승인 대기 사용자 */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-400">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
            승인 대기 ({pending.length}명)
          </h2>
          <div className="glass rounded-xl overflow-hidden border border-amber-400/20">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead className="text-center">가입 경로</TableHead>
                  <TableHead className="text-center">가입일</TableHead>
                  <TableHead className="text-right">승인</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {PROVIDER_LABELS[u.provider] ?? u.provider}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <ApproveUserButton userId={u.id} isApproved={false} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* 승인된 사용자 */}
      {approved.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-muted-foreground">
          승인된 사용자가 없습니다
        </div>
      ) : (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-400">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
            승인됨 ({approved.length}명)
          </h2>
          <div className="glass rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead className="text-center">가입 경로</TableHead>
                  <TableHead className="text-center">역할</TableHead>
                  <TableHead className="text-center">가입일</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approved.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {PROVIDER_LABELS[u.provider] ?? u.provider}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {u.role === 'system_admin' ? (
                        <Badge className="bg-accent/20 text-accent border-accent/30">관리자</Badge>
                      ) : (
                        <Badge variant="outline">참가자</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <ApproveUserButton userId={u.id} isApproved={true} />
                        <RoleToggleButton
                          userId={u.id}
                          currentRole={u.role}
                          isSelf={u.id === currentUserId}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
