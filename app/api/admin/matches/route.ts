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

// GET /api/admin/matches — 전체 경기 목록
export async function GET() {
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ matches: data })
}

// POST /api/admin/matches — 경기 등록
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const body = await request.json()
  const {
    round, group_name, match_number,
    home_country_name, home_country_code,
    away_country_name, away_country_code,
    kickoff_at, venue,
  } = body

  if (!round || !home_country_name || !away_country_name || !kickoff_at) {
    return NextResponse.json({ error: '필수 값이 누락되었습니다' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('matches')
    .insert({
      round, group_name, match_number,
      home_country_name, home_country_code,
      away_country_name, away_country_code,
      kickoff_at, venue,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ match: data }, { status: 201 })
}
