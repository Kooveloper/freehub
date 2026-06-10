'use client';

import { useEffect, useRef } from 'react';

import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import type { AdSlots } from '@/types/site-settings';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[];
  }
}

interface AdBannerProps {
  slotKey: keyof AdSlots;
  adFormat?: string;
  fullWidthResponsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onLoadError?: () => void;
}

export function AdBanner({
  slotKey,
  adFormat,
  fullWidthResponsive = true,
  className,
  style,
  onLoadError,
}: AdBannerProps) {
  const { adsEnabled, adsensePublisherId, adSlots } = useSiteSettings();
  const adSlot = adSlots[slotKey];
  const isDev = process.env.NODE_ENV === 'development';
  const pushed = useRef(false);

  useEffect(() => {
    if (!adsEnabled || isDev || !adsensePublisherId || pushed.current) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      onLoadError?.();
    }
  }, [adsEnabled, isDev, adsensePublisherId, onLoadError]);

  if (!adsEnabled) return null;

  if (isDev) {
    return (
      <div
        className={cn(
          'flex items-center justify-center border border-dashed border-brand-300/35 bg-brand-50/40 text-xs text-brand-500/65',
          className,
        )}
        style={style}
      >
        광고 영역 (AdSense)
      </div>
    );
  }

  if (!adsensePublisherId) return null;

  return (
    <ins
      className={cn('adsbygoogle', className)}
      style={{ display: 'block', ...style }}
      data-ad-client={adsensePublisherId}
      data-ad-slot={adSlot}
      {...(adFormat ? { 'data-ad-format': adFormat } : {})}
      data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
    />
  );
}
