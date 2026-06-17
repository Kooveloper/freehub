-- 회원 프로필 (닉네임)
CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_nickname_length CHECK (char_length(nickname) >= 2 AND char_length(nickname) <= 20)
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_nickname_lower_unique_idx
  ON profiles (lower(nickname));

-- 서비스 리뷰
CREATE TABLE IF NOT EXISTS tool_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tool_id)
);

CREATE INDEX IF NOT EXISTS tool_reviews_tool_id_created_at_idx
  ON tool_reviews (tool_id, created_at DESC);

CREATE INDEX IF NOT EXISTS tool_reviews_tool_id_rating_idx
  ON tool_reviews (tool_id, rating);

CREATE INDEX IF NOT EXISTS tool_reviews_created_at_idx
  ON tool_reviews (created_at DESC);

-- 리뷰 좋아요
CREATE TABLE IF NOT EXISTS review_likes (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id uuid NOT NULL REFERENCES tool_reviews(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, review_id)
);

CREATE INDEX IF NOT EXISTS review_likes_review_id_idx
  ON review_likes (review_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are publicly readable" ON profiles;
CREATE POLICY "Profiles are publicly readable"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Reviews are publicly readable" ON tool_reviews;
CREATE POLICY "Reviews are publicly readable"
  ON tool_reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own reviews" ON tool_reviews;
CREATE POLICY "Users can insert own reviews"
  ON tool_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON tool_reviews;
CREATE POLICY "Users can update own reviews"
  ON tool_reviews FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reviews" ON tool_reviews;
CREATE POLICY "Users can delete own reviews"
  ON tool_reviews FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Review likes are publicly readable" ON review_likes;
CREATE POLICY "Review likes are publicly readable"
  ON review_likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own review likes" ON review_likes;
CREATE POLICY "Users can insert own review likes"
  ON review_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own review likes" ON review_likes;
CREATE POLICY "Users can delete own review likes"
  ON review_likes FOR DELETE
  USING (auth.uid() = user_id);
