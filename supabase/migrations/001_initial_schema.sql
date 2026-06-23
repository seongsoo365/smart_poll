-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 사용자 프로필 (Supabase auth.users 확장)
-- ============================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'participant'
    CHECK (role IN ('system_admin', 'participant')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 재귀 방지용 역할 조회 함수
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================================
-- 경기
-- ============================================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round TEXT NOT NULL
    CHECK (round IN ('group', 'r16', 'qf', 'sf', 'final')),
  group_name TEXT,                    -- 조별리그: A~H, 토너먼트: NULL
  match_number INT NOT NULL DEFAULT 1,
  home_country_code TEXT NOT NULL,    -- 'KOR', 'USA', 'MEX' 등 ISO 3166-1 alpha-3
  away_country_code TEXT NOT NULL,
  home_country_name TEXT NOT NULL,
  away_country_name TEXT NOT NULL,
  kickoff_at TIMESTAMPTZ NOT NULL,
  venue TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  home_score INT,                     -- 결과 확정 전 NULL
  away_score INT,
  prediction_locked_at TIMESTAMPTZ,  -- kickoff_at - 1시간, 트리거로 자동 계산
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 예측
-- ============================================================
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  predicted_winner TEXT NOT NULL
    CHECK (predicted_winner IN ('home', 'draw', 'away')),
  predicted_home_score INT NOT NULL DEFAULT 0,
  predicted_away_score INT NOT NULL DEFAULT 0,
  points_earned INT,                  -- 결과 확정 후 계산, 이전: NULL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- ============================================================
-- 점수 규칙
-- ============================================================
CREATE TABLE scoring_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_type TEXT NOT NULL UNIQUE
    CHECK (rule_type IN ('winner', 'exact_score')),
  points INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT
);

-- 기본 점수 규칙 삽입
INSERT INTO scoring_rules (rule_type, points, description) VALUES
  ('winner',      3, '승무패 결과 정확히 맞추기'),
  ('exact_score', 7, '정확한 스코어 맞추기 (승무패 포함 총 10점)');

-- ============================================================
-- RLS 활성화
-- ============================================================
ALTER TABLE user_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches        ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_rules  ENABLE ROW LEVEL SECURITY;

-- user_profiles 정책
CREATE POLICY "프로필 공개 읽기" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "본인 프로필 수정" ON user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "관리자 전체 관리" ON user_profiles
  FOR ALL TO authenticated
  USING (get_my_role() = 'system_admin');

-- matches 정책 (공개 읽기, 관리자 쓰기)
CREATE POLICY "경기 공개 읽기" ON matches
  FOR SELECT USING (true);

CREATE POLICY "관리자 경기 관리" ON matches
  FOR ALL TO authenticated
  USING (get_my_role() = 'system_admin');

-- predictions 정책
CREATE POLICY "예측 공개 읽기 (통계용)" ON predictions
  FOR SELECT USING (true);

CREATE POLICY "본인 예측 작성" ON predictions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "본인 예측 수정 (마감 전)" ON predictions
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
        AND m.prediction_locked_at > NOW()
    )
  );

CREATE POLICY "관리자 점수 업데이트" ON predictions
  FOR UPDATE TO authenticated
  USING (get_my_role() = 'system_admin');

-- scoring_rules 정책
CREATE POLICY "점수 규칙 공개 읽기" ON scoring_rules
  FOR SELECT USING (true);

CREATE POLICY "관리자 점수 규칙 관리" ON scoring_rules
  FOR ALL TO authenticated
  USING (get_my_role() = 'system_admin');

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX idx_matches_round    ON matches(round);
CREATE INDEX idx_matches_status   ON matches(status);
CREATE INDEX idx_matches_kickoff  ON matches(kickoff_at);
CREATE INDEX idx_predictions_user  ON predictions(user_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);

-- ============================================================
-- 트리거: matches.prediction_locked_at 자동 계산 (kickoff_at - 1시간)
-- GENERATED ALWAYS AS 는 timestamptz 연산이 immutable 하지 않아 사용 불가
-- ============================================================
CREATE OR REPLACE FUNCTION set_prediction_locked_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.prediction_locked_at := NEW.kickoff_at - INTERVAL '1 hour';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER matches_set_locked_at
  BEFORE INSERT OR UPDATE OF kickoff_at ON matches
  FOR EACH ROW EXECUTE FUNCTION set_prediction_locked_at();

-- ============================================================
-- 트리거: 신규 사용자 프로필 자동 생성
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 트리거: predictions.updated_at 자동 갱신
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER predictions_updated_at
  BEFORE UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
