import { createClientSafe } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import RoleToggleButton from '@/components/admin/RoleToggleButton'
import { Users } from 'lucide-react'
import type { UserProfile } from '@/types'

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

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Users className="size-6 text-primary" />
        <h1 className="text-2xl font-bold">참가자 관리</h1>
        <span className="text-sm text-muted-foreground">({users.length}명)</span>
      </div>

      {users.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-muted-foreground">
          등록된 사용자가 없습니다
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead className="text-center">역할</TableHead>
                <TableHead className="text-center">가입일</TableHead>
                <TableHead className="text-right">역할 변경</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
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
                  <TableCell className="text-right">
                    <RoleToggleButton
                      userId={u.id}
                      currentRole={u.role}
                      isSelf={u.id === currentUserId}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
