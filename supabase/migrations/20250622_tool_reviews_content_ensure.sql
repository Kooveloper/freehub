-- tool_reviews 예상 컬럼 보장 (CREATE TABLE IF NOT EXISTS만 실행된 경우 대비)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'tool_reviews'
  ) THEN
    CREATE TABLE tool_reviews (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tool_id uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
      content text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (user_id, tool_id)
    );
    RETURN;
  END IF;

  -- body 등 다른 이름으로 만들어진 경우 content로 통일
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tool_reviews'
      AND column_name = 'body'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tool_reviews'
      AND column_name = 'content'
  ) THEN
    ALTER TABLE tool_reviews RENAME COLUMN body TO content;
  END IF;

  ALTER TABLE tool_reviews
    ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT '';

  ALTER TABLE tool_reviews
    ADD COLUMN IF NOT EXISTS rating smallint;

  ALTER TABLE tool_reviews
    ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

  ALTER TABLE tool_reviews
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

  -- rating NOT NULL + check (신규 컬럼만)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tool_reviews'
      AND column_name = 'rating'
      AND is_nullable = 'YES'
  ) THEN
    UPDATE tool_reviews SET rating = 5 WHERE rating IS NULL;
    ALTER TABLE tool_reviews ALTER COLUMN rating SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS tool_reviews_tool_id_created_at_idx
  ON tool_reviews (tool_id, created_at DESC);

CREATE INDEX IF NOT EXISTS tool_reviews_tool_id_rating_idx
  ON tool_reviews (tool_id, rating);

CREATE INDEX IF NOT EXISTS tool_reviews_created_at_idx
  ON tool_reviews (created_at DESC);
