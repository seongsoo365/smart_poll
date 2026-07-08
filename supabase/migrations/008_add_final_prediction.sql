-- ================================================================
-- 결승 진출국 맞추기 스팟 이벤트
-- ================================================================

-- ============================================================
-- 이벤트 설정 (싱글톤: 항상 1개 행만 유지)
-- ============================================================
CREATE TABLE final_prediction_event (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lock_at TIMESTAMPTZ NOT NULL,           -- 관리자가 지정하는 예측 마감 시각
  is_open BOOLEAN NOT NULL DEFAULT FALSE, -- 예측 페이지 공개 여부
  points_one_correct INT NOT NULL DEFAULT 5,   -- 결승 진출국 1개만 맞춘 경우 점수
  points_both_correct INT NOT NULL DEFAULT 15, -- 결승 진출국 2개 모두 맞춘 경우 점수
  actual_country_code_1 TEXT,             -- 실제 결승 진출국 (관리자가 채점 시 입력)
  actual_country_name_1 TEXT,
  actual_country_code_2 TEXT,
  actual_country_name_2 TEXT,
  graded_at TIMESTAMPTZ,                  -- 채점 완료 시각 (NULL이면 미채점)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 이벤트 행 시드 (마감 시각은 관리자가 추후 실제 값으로 변경)
INSERT INTO final_prediction_event (lock_at, is_open) VALUES
  (NOW() + INTERVAL '30 days', FALSE);

-- ============================================================
-- 사용자별 결승 진출국 예측 (1인 1건)
-- ============================================================
CREATE TABLE final_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  predicted_country_code_1 TEXT NOT NULL,
  predicted_country_name_1 TEXT NOT NULL,
  predicted_country_code_2 TEXT NOT NULL,
  predicted_country_name_2 TEXT NOT NULL,
  points_earned INT,                      -- 채점 전 NULL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_final_predictions_user ON final_predictions(user_id);

-- ============================================================
-- RLS 활성화
-- ============================================================
ALTER TABLE final_prediction_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_predictions      ENABLE ROW LEVEL SECURITY;

-- final_prediction_event 정책
CREATE POLICY "결승 이벤트 공개 읽기" ON final_prediction_event
  FOR SELECT USING (true);

CREATE POLICY "관리자 결승 이벤트 관리" ON final_prediction_event
  FOR ALL TO authenticated
  USING (get_my_role() = 'system_admin');

-- final_predictions 정책
CREATE POLICY "결승 예측 공개 읽기" ON final_predictions
  FOR SELECT USING (true);

CREATE POLICY "본인 결승 예측 작성" ON final_predictions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "본인 결승 예측 수정 (마감 전)" ON final_predictions
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM final_prediction_event e
      WHERE e.lock_at > NOW()
    )
  );

CREATE POLICY "관리자 결승 예측 채점" ON final_predictions
  FOR UPDATE TO authenticated
  USING (get_my_role() = 'system_admin');

-- ============================================================
-- 트리거: updated_at 자동 갱신 (기존 update_updated_at() 재사용)
-- ============================================================
CREATE TRIGGER final_prediction_event_updated_at
  BEFORE UPDATE ON final_prediction_event
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER final_predictions_updated_at
  BEFORE UPDATE ON final_predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
