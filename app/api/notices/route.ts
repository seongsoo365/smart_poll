import { NextResponse } from 'next/server'
import { createClientSafe } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClientSafe()
  if (!supabase) return NextResponse.json(null)

  const { data } = await supabase
    .from('notices')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json(data ?? null)
}
