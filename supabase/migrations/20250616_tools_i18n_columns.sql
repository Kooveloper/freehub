-- tools 테이블 영문(i18n) 컬럼 추가
-- (어드민 저장 시 description_en 등 필요)

ALTER TABLE tools
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS free_limit_unit_en text,
  ADD COLUMN IF NOT EXISTS free_description_en text,
  ADD COLUMN IF NOT EXISTS free_features_en text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS paid_only_features_en text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags_en text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tip_en text;
