-- Google Search Console 색인 요청/조회 이력 (블로그 글별)

CREATE TABLE IF NOT EXISTS blog_indexing_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_indexed boolean,
  coverage_state text,
  indexing_verdict text,
  last_inspected_at timestamptz,
  last_submitted_at timestamptz,
  submit_count integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id)
);

CREATE INDEX IF NOT EXISTS idx_blog_indexing_log_is_indexed
  ON blog_indexing_log (is_indexed, last_inspected_at);

CREATE INDEX IF NOT EXISTS idx_blog_indexing_log_last_submitted
  ON blog_indexing_log (last_submitted_at);

ALTER TABLE blog_indexing_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog indexing log service role all" ON blog_indexing_log;
CREATE POLICY "blog indexing log service role all"
  ON blog_indexing_log FOR ALL USING (true);
