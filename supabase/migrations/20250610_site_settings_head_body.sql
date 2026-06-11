-- site_settings 테이블 (미적용 시 생성) + body 상단 코드 컬럼

CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ads_enabled boolean NOT NULL DEFAULT false,
  adsense_publisher_id text,
  ad_slot_home_top text,
  ad_slot_in_feed text,
  ad_slot_sidebar text,
  ad_slot_detail_btm text,
  ad_slot_blog_mid text,
  extra_head_html text,
  extra_body_html text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS extra_head_html text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS extra_body_html text;

INSERT INTO site_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM site_settings LIMIT 1);
