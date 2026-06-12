-- 서브카테고리 테이블 + tools.sub_category

CREATE TABLE IF NOT EXISTS sub_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category_slug text NOT NULL REFERENCES categories(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_categories_category_slug
  ON sub_categories(category_slug);

CREATE INDEX IF NOT EXISTS idx_sub_categories_category_sort
  ON sub_categories(category_slug, sort_order);

ALTER TABLE tools ADD COLUMN IF NOT EXISTS sub_category text;

CREATE INDEX IF NOT EXISTS idx_tools_sub_category ON tools(sub_category);
