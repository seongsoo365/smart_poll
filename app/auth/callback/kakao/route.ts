import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = new URL(request.url).origin
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const storedState = request.cookies.get('kakao_oauth_state')?.value

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=kakao_code_missing`)
  }
  if (!state || state !== storedState) {
    return NextResponse.redirect(`${origin}/auth/login?error=invalid_state`)
  }

  const clientId = process.env.KAKAO_CLIENT_ID
  if (!clientId) {
    return NextResponse.redirect(`${origin}/auth/login?error=kakao_not_configured`)
  }

  // 1. 카카오 access token 교환
  let kakaoToken: string
  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: `${origin}/auth/callback/kakao`,
      code,
      ...(process.env.KAKAO_CLIENT_SECRET ? { client_secret: process.env.KAKAO_CLIENT_SECRET } : {}),
    })
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    const tokenData = await tokenRes.json() as { access_token?: string }
    if (!tokenData.access_token) throw new Error('No access token')
    kakaoToken = tokenData.access_token
  } catch {
    return NextResponse.redirect(`${origin}/auth/login?error=kakao_token_failed`)
  }

  // 2. 카카오 사용자 프로필 조회
  let email: string
  let name: string
  let avatarUrl: string | null = null
  try {
    const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${kakaoToken}` },
    })
    const profileData = await profileRes.json() as {
      id: number
      kakao_account?: {
        email?: string
        profile?: { nickname?: string; profile_image_url?: string }
      }
    }
    email = profileData.kakao_account?.email ?? `kakao_${profileData.id}@kakao.user`
    name = profileData.kakao_account?.profile?.nickname ?? `카카오사용자${profileData.id}`
    avatarUrl = profileData.kakao_account?.profile?.profile_image_url ?? null
  } catch {
    return NextResponse.redirect(`${origin}/auth/login?error=kakao_profile_failed`)
  }

  // 3. Supabase 사용자 생성 또는 업데이트
  try {
    const adminClient = createAdminClient()

    const { data: existing } = await adminClient
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (!existing) {
      // 신규 사용자 — handle_new_user 트리거가 user_profiles 자동 생성
      const { error: createErr } = await adminClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { name, avatar_url: avatarUrl, provider: 'kakao' },
      })
      if (createErr) throw createErr
    } else {
      // 기존 사용자 — 아바타 갱신
      await adminClient
        .from('user_profiles')
        .update({ avatar_url: avatarUrl, provider: 'kakao' })
        .eq('id', existing.id)
    }

    // 4. 매직 링크 생성 → 클라이언트에서 세션 수립
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${origin}/auth/kakao/complete` },
    })
    if (linkErr || !linkData) throw new Error('generateLink failed')

    const response = NextResponse.redirect(linkData.properties.action_link)
    response.cookies.delete('kakao_oauth_state')
    return response
  } catch {
    return NextResponse.redirect(`${origin}/auth/login?error=kakao_link_failed`)
  }
}
