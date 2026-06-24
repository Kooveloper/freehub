-- main_keywords: TEXT[] → KeywordItem[] JSONB
-- (ALTER TYPE ... USING 에서는 서브쿼리 불가 → 컬럼 교체 방식)

ALTER TABLE blog_automation_settings
  ADD COLUMN IF NOT EXISTS main_keywords_jsonb JSONB DEFAULT '[]'::jsonb;

UPDATE blog_automation_settings
SET main_keywords_jsonb = CASE
  WHEN main_keywords IS NULL THEN '[]'::jsonb
  ELSE COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', gen_random_uuid()::text,
          'keyword', elem,
          'category', '',
          'sub_category', ''
        )
      )
      FROM unnest(main_keywords::text[]) AS elem
    ),
    '[]'::jsonb
  )
END;

ALTER TABLE blog_automation_settings
  DROP COLUMN IF EXISTS main_keywords;

ALTER TABLE blog_automation_settings
  RENAME COLUMN main_keywords_jsonb TO main_keywords;

ALTER TABLE blog_automation_settings
  ALTER COLUMN main_keywords SET DEFAULT '[]'::jsonb;
