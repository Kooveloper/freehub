-- free_limit_type에 'other'(기타) 추가

ALTER TABLE tools
  DROP CONSTRAINT IF EXISTS tools_free_limit_type_check;

ALTER TABLE tools
  ADD CONSTRAINT tools_free_limit_type_check
  CHECK (free_limit_type IN ('daily', 'monthly', 'total', 'unlimited', 'other'));
