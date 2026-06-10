'use client';

import { useSiteSettings } from '@/contexts/SiteSettingsContext';

/** 광고가 실제로 표시되는지 (비활성·슬롯 미설정 시 false) */
export function useAdsActive(): boolean {
  const { adsEnabled, adsensePublisherId } = useSiteSettings();
  const isDev = process.env.NODE_ENV === 'development';
  return adsEnabled && (isDev || Boolean(adsensePublisherId));
}
