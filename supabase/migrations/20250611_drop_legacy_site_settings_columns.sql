-- 어드민에서 더 이상 쓰지 않는 site_settings 컬럼 제거

ALTER TABLE site_settings DROP COLUMN IF EXISTS ga_measurement_id;
ALTER TABLE site_settings DROP COLUMN IF EXISTS google_site_verification;
ALTER TABLE site_settings DROP COLUMN IF EXISTS naver_site_verification;
ALTER TABLE site_settings DROP COLUMN IF EXISTS bing_site_verification;
ALTER TABLE site_settings DROP COLUMN IF EXISTS site_name;
ALTER TABLE site_settings DROP COLUMN IF EXISTS meta_title_ko;
ALTER TABLE site_settings DROP COLUMN IF EXISTS meta_title_en;
ALTER TABLE site_settings DROP COLUMN IF EXISTS meta_description_ko;
ALTER TABLE site_settings DROP COLUMN IF EXISTS meta_description_en;
ALTER TABLE site_settings DROP COLUMN IF EXISTS og_title_ko;
ALTER TABLE site_settings DROP COLUMN IF EXISTS og_title_en;
ALTER TABLE site_settings DROP COLUMN IF EXISTS og_description_ko;
ALTER TABLE site_settings DROP COLUMN IF EXISTS og_description_en;
ALTER TABLE site_settings DROP COLUMN IF EXISTS og_image_url;
ALTER TABLE site_settings DROP COLUMN IF EXISTS favicon_url;
