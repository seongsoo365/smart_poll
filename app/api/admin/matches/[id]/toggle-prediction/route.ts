import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'system_admin') {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })
  }

  const { data: match } = await supabase
    .from('matches')
    .select('id, is_prediction_open')
    .eq('id', id)
    .single()

  if (!match) {
    return NextResponse.json({ error: '경기를 찾을 수 없습니다' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('matches')
    .update({ is_prediction_open: !match.is_prediction_open })
    .eq('id', id)
    .select('id, is_prediction_open')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ match: data })
}
