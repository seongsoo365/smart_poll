-- 2026 FIFA 월드컵은 48개국 참가 → 32강 라운드 추가
ALTER TABLE matches DROP CONSTRAINT matches_round_check;
ALTER TABLE matches ADD CONSTRAINT matches_round_check
  CHECK (round IN ('group', 'r32', 'r16', 'qf', 'sf', 'final'));
