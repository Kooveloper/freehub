-- PostgREST embedded join용 (프로필 없는 리뷰가 있으면 스킵)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tool_reviews_user_id_profiles_fkey'
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM tool_reviews tr
    LEFT JOIN profiles p ON p.user_id = tr.user_id
    WHERE p.user_id IS NULL
  ) THEN
    RAISE NOTICE 'Skipped tool_reviews_user_id_profiles_fkey: reviews without profiles exist';
    RETURN;
  END IF;

  ALTER TABLE tool_reviews
    ADD CONSTRAINT tool_reviews_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
END $$;
