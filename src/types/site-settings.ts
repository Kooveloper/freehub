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
  extra_head_html: string | null;
  extra_body_html: string | null;
  updated_at: string;
}

export interface ResolvedSiteSettings {
  adsEnabled: boolean;
  adsensePublisherId: string | null;
  adSlots: AdSlots;
  /** AdSense 인피드 광고 단위 생성 시 발급되는 layout-key */
  adInfeedLayoutKey: string | null;
  extraHeadHtml: string | null;
  extraBodyHtml: string | null;
}
