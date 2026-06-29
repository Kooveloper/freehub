-- 툴 상세 외부 링크 클릭 이벤트 (기간별 통계용)

CREATE TABLE IF NOT EXISTS tool_click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  category_slug text NOT NULL,
  sub_category text,
  click_type text NOT NULL CHECK (click_type IN ('official_site', 'cta_start_free')),
  clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tool_click_events_clicked_at
  ON tool_click_events(clicked_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_click_events_category_clicked_at
  ON tool_click_events(category_slug, clicked_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_click_events_sub_clicked_at
  ON tool_click_events(sub_category, clicked_at DESC)
  WHERE sub_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tool_click_events_tool_clicked_at
  ON tool_click_events(tool_id, clicked_at DESC);
