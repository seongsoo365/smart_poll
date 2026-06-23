export default function SetupBanner() {
  return (
    <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-2 text-center text-sm text-yellow-300">
      ⚠️ Supabase 환경 변수가 설정되지 않았습니다.{' '}
      <code className="rounded bg-black/20 px-1 py-0.5">.env.local</code>에 Supabase URL과 키를
      추가하세요.
    </div>
  )
}
