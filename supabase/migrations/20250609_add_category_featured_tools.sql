-- 카테고리별 인기 서비스 (Top 5) 수동 순서
CREATE TABLE IF NOT EXISTS category_featured_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug text NOT NULL,
  tool_id uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_slug, tool_id)
);

CREATE INDEX IF NOT EXISTS idx_category_featured_tools_slug
  ON category_featured_tools (category_slug, sort_order);
