-- ================================================================
-- 예측 마감 기준을 kickoff_at - 1시간에서 kickoff_at으로 변경
-- ================================================================

-- 1. prediction_locked_at 자동 설정 트리거 제거
DROP TRIGGER IF EXISTS matches_set_locked_at ON matches;
DROP FUNCTION IF EXISTS set_prediction_locked_at();

-- 2. 기존에 자동 설정된 prediction_locked_at 값 초기화
UPDATE matches SET prediction_locked_at = NULL;

-- 3. RLS 정책 수정: kickoff_at 기준으로 변경
DROP POLICY IF EXISTS "본인 예측 수정 (마감 전)" ON predictions;

CREATE POLICY "본인 예측 수정 (마감 전)" ON predictions
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
        AND COALESCE(m.prediction_locked_at, m.kickoff_at) > NOW()
    )
  );
