-- 기간별 즐겨찾기 통계 조회 성능
CREATE INDEX IF NOT EXISTS favorites_created_at_idx
  ON favorites (created_at DESC);
