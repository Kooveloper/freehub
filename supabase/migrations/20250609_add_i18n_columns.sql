-- Bilingual content columns for tools and categories
-- Run this in Supabase SQL Editor

ALTER TABLE tools
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS free_limit_unit_en text,
  ADD COLUMN IF NOT EXISTS free_description_en text,
  ADD COLUMN IF NOT EXISTS free_features_en text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS paid_only_features_en text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags_en text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tip_en text;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS description_en text;
