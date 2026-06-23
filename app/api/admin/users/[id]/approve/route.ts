import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PUT /api/admin/users/[id]/approve — 사용자 승인/취소
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { data: myProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (myProfile?.role !== 'system_admin') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { approved } = await request.json() as { approved: boolean }

  const { error } = await supabase
    .from('user_profiles')
    .update({ is_approved: approved })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
