-- 유저 즐겨찾기
CREATE TABLE IF NOT EXISTS favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tool_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_id_created_at_idx
  ON favorites (user_id, created_at DESC);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own favorites" ON favorites;
CREATE POLICY "Users can read own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);
