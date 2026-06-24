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

// GET /api/admin/notices — 공지사항 목록
export async function GET() {
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notices: data })
}

// POST /api/admin/notices — 공지사항 등록
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { title, content, is_active } = await request.json()
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: '제목과 내용을 입력하세요' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('notices')
    .insert({ title: title.trim(), content: content.trim(), is_active: is_active ?? true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notice: data }, { status: 201 })
}
