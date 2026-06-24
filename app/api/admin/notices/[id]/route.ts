import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'system_admin') return null
  return user
}

// PATCH /api/admin/notices/[id] — 공지사항 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.title !== undefined) updates.title = body.title.trim()
  if (body.content !== undefined) updates.content = body.content.trim()
  if (body.is_active !== undefined) updates.is_active = body.is_active
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('notices')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notice: data })
}

// DELETE /api/admin/notices/[id] — 공지사항 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { id } = await params

  const { error } = await supabase.from('notices').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
