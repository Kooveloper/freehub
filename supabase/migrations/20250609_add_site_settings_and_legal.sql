-- Site settings (singleton) and legal pages

CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ads_enabled boolean NOT NULL DEFAULT false,
  adsense_publisher_id text,
  ad_slot_home_top text,
  ad_slot_in_feed text,
  ad_slot_sidebar text,
  ad_slot_detail_btm text,
  ad_slot_blog_mid text,
  ga_measurement_id text,
  google_site_verification text,
  naver_site_verification text,
  bing_site_verification text,
  site_name text,
  meta_title_ko text,
  meta_title_en text,
  meta_description_ko text,
  meta_description_en text,
  og_title_ko text,
  og_title_en text,
  og_description_ko text,
  og_description_en text,
  og_image_url text,
  favicon_url text,
  extra_head_html text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO site_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM site_settings LIMIT 1);

CREATE TABLE IF NOT EXISTS legal_pages (
  slug text PRIMARY KEY CHECK (slug IN ('privacy', 'terms')),
  title_ko text NOT NULL,
  title_en text,
  content_ko text NOT NULL,
  content_en text,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO legal_pages (slug, title_ko, title_en, content_ko, content_en, effective_date)
VALUES
  ('privacy', '개인정보처리방침', 'Privacy Policy', '콘텐츠를 어드민에서 수정해주세요.', 'Please edit content in admin.', CURRENT_DATE),
  ('terms', '이용약관', 'Terms of Service', '콘텐츠를 어드민에서 수정해주세요.', 'Please edit content in admin.', CURRENT_DATE)
ON CONFLICT (slug) DO NOTHING;
