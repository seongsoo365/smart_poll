import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function GET(request: NextRequest) {
  const clientId = process.env.KAKAO_CLIENT_ID
  if (!clientId) {
    return NextResponse.redirect(new URL('/auth/login?error=kakao_not_configured', request.url))
  }

  const state = randomBytes(16).toString('hex')
  const origin = new URL(request.url).origin

  const kakaoAuthUrl = new URL('https://kauth.kakao.com/oauth/authorize')
  kakaoAuthUrl.searchParams.set('client_id', clientId)
  kakaoAuthUrl.searchParams.set('redirect_uri', `${origin}/auth/callback/kakao`)
  kakaoAuthUrl.searchParams.set('response_type', 'code')
  kakaoAuthUrl.searchParams.set('state', state)

  const response = NextResponse.redirect(kakaoAuthUrl.toString())
  response.cookies.set('kakao_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  })
  return response
}
