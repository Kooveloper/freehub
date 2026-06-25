-- 인기 서비스 수동 순서 (어드민 Featured) — 테이블·RLS 보장
CREATE TABLE IF NOT EXISTS category_featured_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug text NOT NULL,
  tool_id uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_slug, tool_id)
);

CREATE INDEX IF NOT EXISTS idx_category_featured_tools_slug
  ON category_featured_tools (category_slug, sort_order);

ALTER TABLE category_featured_tools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "category featured tools public read" ON category_featured_tools;
CREATE POLICY "category featured tools public read"
  ON category_featured_tools FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "category featured tools service role all" ON category_featured_tools;
CREATE POLICY "category featured tools service role all"
  ON category_featured_tools FOR ALL
  USING (true);
