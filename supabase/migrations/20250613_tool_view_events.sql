-- 툴 상세 조회 이벤트 (기간별 통계용)

CREATE TABLE IF NOT EXISTS tool_view_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  category_slug text NOT NULL,
  sub_category text,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tool_view_events_viewed_at
  ON tool_view_events(viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_view_events_category_viewed_at
  ON tool_view_events(category_slug, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_view_events_sub_viewed_at
  ON tool_view_events(sub_category, viewed_at DESC)
  WHERE sub_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tool_view_events_tool_viewed_at
  ON tool_view_events(tool_id, viewed_at DESC);
