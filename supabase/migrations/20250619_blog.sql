-- Blog posts and automation settings

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  meta_description TEXT,
  tags TEXT[],
  category TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'auto')),
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_automation_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN DEFAULT false,
  publish_schedule TEXT DEFAULT 'daily'
    CHECK (publish_schedule IN ('daily', 'weekdays', 'weekly')),
  publish_time TEXT DEFAULT '09:00',
  main_keywords TEXT[],
  cta_links JSONB DEFAULT '[]',
  target_categories TEXT[],
  tone TEXT DEFAULT 'friendly',
  post_length TEXT DEFAULT 'medium'
    CHECK (post_length IN ('short', 'medium', 'long')),
  auto_publish BOOLEAN DEFAULT false,
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO blog_automation_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM blog_automation_settings LIMIT 1);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_automation_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog posts public read published" ON blog_posts;
CREATE POLICY "blog posts public read published"
  ON blog_posts FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "blog posts service role all" ON blog_posts;
CREATE POLICY "blog posts service role all"
  ON blog_posts FOR ALL USING (true);

DROP POLICY IF EXISTS "automation settings service role all" ON blog_automation_settings;
CREATE POLICY "automation settings service role all"
  ON blog_automation_settings FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
