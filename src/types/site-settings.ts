export interface AdSlots {
  HOME_TOP: string;
  IN_FEED: string;
  SIDEBAR: string;
  DETAIL_BTM: string;
  BLOG_MID: string;
}

export interface SiteSettings {
  id: string;
  ads_enabled: boolean;
  adsense_publisher_id: string | null;
  ad_slot_home_top: string | null;
  ad_slot_in_feed: string | null;
  ad_slot_sidebar: string | null;
  ad_slot_detail_btm: string | null;
  ad_slot_blog_mid: string | null;
  ga_measurement_id: string | null;
  google_site_verification: string | null;
  naver_site_verification: string | null;
  bing_site_verification: string | null;
  site_name: string | null;
  meta_title_ko: string | null;
  meta_title_en: string | null;
  meta_description_ko: string | null;
  meta_description_en: string | null;
  og_title_ko: string | null;
  og_title_en: string | null;
  og_description_ko: string | null;
  og_description_en: string | null;
  og_image_url: string | null;
  favicon_url: string | null;
  extra_head_html: string | null;
  updated_at: string;
}

export interface ResolvedSiteSettings {
  adsEnabled: boolean;
  adsensePublisherId: string | null;
  adSlots: AdSlots;
  gaMeasurementId: string | null;
  googleSiteVerification: string | null;
  naverSiteVerification: string | null;
  bingSiteVerification: string | null;
  siteName: string;
  metaTitleKo: string | null;
  metaTitleEn: string | null;
  metaDescriptionKo: string | null;
  metaDescriptionEn: string | null;
  ogTitleKo: string | null;
  ogTitleEn: string | null;
  ogDescriptionKo: string | null;
  ogDescriptionEn: string | null;
  ogImageUrl: string | null;
  faviconUrl: string | null;
  extraHeadHtml: string | null;
}
