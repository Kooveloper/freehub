import { AD_SLOTS } from '@/constants/ads';
import { redis } from '@/lib/redis';
import { createStaticClient } from '@/lib/supabase/server';
import type { AdSlots, ResolvedSiteSettings, SiteSettings } from '@/types/site-settings';

const CACHE_KEY = 'site:settings';
const CACHE_TTL = 60;

function resolveAdSlots(row: SiteSettings | null): AdSlots {
  return {
    HOME_TOP: row?.ad_slot_home_top || AD_SLOTS.HOME_TOP,
    IN_FEED: row?.ad_slot_in_feed || AD_SLOTS.IN_FEED,
    SIDEBAR: row?.ad_slot_sidebar || AD_SLOTS.SIDEBAR,
    DETAIL_BTM: row?.ad_slot_detail_btm || AD_SLOTS.DETAIL_BTM,
    BLOG_MID: row?.ad_slot_blog_mid || AD_SLOTS.BLOG_MID,
  };
}

export function resolveSiteSettings(row: SiteSettings | null): ResolvedSiteSettings {
  const adsensePublisherId =
    row?.adsense_publisher_id?.trim() ||
    process.env.NEXT_PUBLIC_ADSENSE_ID?.trim() ||
    null;

  const adsEnabled = Boolean(row?.ads_enabled && adsensePublisherId);

  return {
    adsEnabled,
    adsensePublisherId,
    adSlots: resolveAdSlots(row),
    extraHeadHtml: row?.extra_head_html?.trim() || null,
    extraBodyHtml: row?.extra_body_html?.trim() || null,
  };
}

export async function getSiteSettingsRow(): Promise<SiteSettings | null> {
  try {
    const cached = await redis.get<SiteSettings>(CACHE_KEY);
    if (cached) return cached;
  } catch {
    // ignore cache errors
  }

  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  try {
    await redis.set(CACHE_KEY, data, { ex: CACHE_TTL });
  } catch {
    // ignore cache errors
  }

  return data as SiteSettings;
}

export async function getSiteSettings(): Promise<ResolvedSiteSettings> {
  const row = await getSiteSettingsRow();
  return resolveSiteSettings(row);
}

export async function invalidateSiteSettingsCache() {
  try {
    await redis.del(CACHE_KEY);
  } catch {
    // ignore
  }
}
