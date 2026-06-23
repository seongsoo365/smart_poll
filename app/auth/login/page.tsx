'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const ERROR_MESSAGES: Record<string, string> = {
  auth_callback_error: '로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
  kakao_not_configured: '카카오 로그인이 설정되지 않았습니다.',
  kakao_token_failed: '카카오 인증에 실패했습니다.',
  kakao_profile_failed: '카카오 프로필 조회에 실패했습니다.',
  kakao_link_failed: '카카오 계정 연동에 실패했습니다.',
  kakao_no_token: '카카오 로그인 세션 정보를 받지 못했습니다.',
  kakao_session_failed: '카카오 세션 생성에 실패했습니다.',
  kakao_code_missing: '카카오 인증 코드가 없습니다.',
  invalid_state: '보안 검증에 실패했습니다. 다시 시도해 주세요.',
}

function LoginContent() {
  const searchParams = useSearchParams()
  const [googleLoading, setGoogleLoading] = useState(false)
  const [kakaoLoading, setKakaoLoading] = useState(false)

  useEffect(() => {
    const error = searchParams.get('error')
    if (error && ERROR_MESSAGES[error]) {
      toast.error(ERROR_MESSAGES[error])
    }
  }, [searchParams])

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      toast.error('구글 로그인 실패: ' + error.message)
      setGoogleLoading(false)
    }
  }

  function handleKakaoLogin() {
    setKakaoLoading(true)
    window.location.href = '/auth/kakao'
  }

  const busy = googleLoading || kakaoLoading

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass w-full max-w-sm rounded-2xl p-8 text-center">
        <div className="mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
            ⚽
          </div>
          <h1 className="text-2xl font-bold">스마트폴</h1>
          <p className="mt-1 text-sm text-muted-foreground">2026 북중미 월드컵 승부 예측</p>
        </div>

        <div className="space-y-3">
          {/* Google 로그인 */}
          <button
            onClick={handleGoogleLogin}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            <span>{googleLoading ? '로그인 중...' : 'Google로 계속하기'}</span>
          </button>

          {/* 카카오 로그인 */}
          <button
            onClick={handleKakaoLogin}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#FEE500] px-4 py-3 text-sm font-medium text-[#191919] transition hover:bg-[#FDD800] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {kakaoLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-yellow-600 border-t-yellow-900" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#191919" aria-hidden="true">
                <path d="M12 3C7.03 3 3 6.14 3 10c0 2.5 1.58 4.72 4 6.08-.17.63-.62 2.3-.71 2.65-.11.44.16.43.34.31.14-.09 2.2-1.47 3.09-2.06.41.06.83.09 1.28.09 4.97 0 9-3.14 9-7S16.97 3 12 3z" />
              </svg>
            )}
            <span>{kakaoLoading ? '로그인 중...' : '카카오로 계속하기'}</span>
          </button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          처음 로그인 시 관리자 승인 후 서비스 이용이 가능합니다
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
