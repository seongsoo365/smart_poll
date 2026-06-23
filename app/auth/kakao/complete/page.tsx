'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function KakaoCompletePage() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) {
      router.replace('/auth/login?error=kakao_no_token')
      return
    }

    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken || !refreshToken) {
      router.replace('/auth/login?error=kakao_no_token')
      return
    }

    const supabase = createClient()
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(async ({ error }) => {
        if (error) {
          router.replace('/auth/login?error=kakao_session_failed')
          return
        }
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace('/auth/login?error=kakao_session_failed')
          return
        }
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_approved')
          .eq('id', user.id)
          .single()

        router.replace(profile?.is_approved ? '/' : '/auth/pending')
      })
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">카카오 로그인 처리 중...</p>
      </div>
    </div>
  )
}
