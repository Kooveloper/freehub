-- main_keywords: TEXT[] → KeywordItem[] JSONB
ALTER TABLE blog_automation_settings
  ALTER COLUMN main_keywords TYPE JSONB USING (
    CASE
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
    END
  );

ALTER TABLE blog_automation_settings
  ALTER COLUMN main_keywords SET DEFAULT '[]'::jsonb;
