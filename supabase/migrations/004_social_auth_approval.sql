-- 소셜 로그인 + 관리자 승인 시스템 추가

-- user_profiles 컬럼 추가
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS provider    TEXT    NOT NULL DEFAULT 'google',
  ADD COLUMN IF NOT EXISTS avatar_url  TEXT;

-- 관리자 이메일 자동 승인 (이미 존재할 경우)
UPDATE user_profiles
  SET is_approved = TRUE, role = 'system_admin'
  WHERE email = 'saintoss93@gmail.com';

-- ============================================================
-- 트리거 함수 업데이트
--   - 관리자 이메일: is_approved=true, role=system_admin 자동 설정
--   - 일반 사용자: is_approved=false (관리자 승인 필요)
--   - provider / avatar_url 자동 저장
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_is_approved BOOLEAN;
  v_role        TEXT;
BEGIN
  IF NEW.email = 'saintoss93@gmail.com' THEN
    v_is_approved := TRUE;
    v_role        := 'system_admin';
  ELSE
    v_is_approved := FALSE;
    v_role        := 'participant';
  END IF;

  INSERT INTO public.user_profiles (id, email, name, is_approved, role, provider, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    v_is_approved,
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'provider', 'google'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.user_profiles.avatar_url),
    name       = COALESCE(NULLIF(EXCLUDED.name, ''), public.user_profiles.name),
    provider   = COALESCE(EXCLUDED.provider, public.user_profiles.provider);
    -- is_approved / role 은 업데이트하지 않음 (한번 승인되면 유지)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
