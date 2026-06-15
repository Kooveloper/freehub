-- 툴 ↔ 카테고리/서브카테고리 다대다 (한 툴이 여러 분류에 노출)

CREATE TABLE IF NOT EXISTS tool_category_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  category_slug text NOT NULL REFERENCES categories(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  sub_category text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tool_id, category_slug, sub_category)
);

CREATE INDEX IF NOT EXISTS idx_tool_category_assignments_tool_id
  ON tool_category_assignments(tool_id);

CREATE INDEX IF NOT EXISTS idx_tool_category_assignments_category
  ON tool_category_assignments(category_slug);

CREATE INDEX IF NOT EXISTS idx_tool_category_assignments_sub
  ON tool_category_assignments(sub_category)
  WHERE sub_category IS NOT NULL;

-- 기존 tools.category_slug / sub_category → 1차 분류로 이전
INSERT INTO tool_category_assignments (tool_id, category_slug, sub_category, sort_order)
SELECT id, category_slug, sub_category, 0
FROM tools
WHERE category_slug IS NOT NULL
ON CONFLICT (tool_id, category_slug, sub_category) DO NOTHING;
