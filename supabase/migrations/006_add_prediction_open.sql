-- 관리자가 예측을 허용할 경기를 선택할 수 있도록 is_prediction_open 컬럼 추가
ALTER TABLE matches
  ADD COLUMN is_prediction_open BOOLEAN NOT NULL DEFAULT FALSE;

-- 관리자가 경기별 예측 허용 여부를 수정할 수 있도록 기존 policy 에 포함됨
-- ("관리자 경기 관리" policy 가 ALL 권한이므로 별도 추가 불필요)
