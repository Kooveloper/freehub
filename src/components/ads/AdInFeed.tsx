'use client';

import { cn } from '@/lib/utils';

import { useSiteSettings } from '@/contexts/SiteSettingsContext';

import { AdSlot } from './AdSlot';

interface AdInFeedProps {
  className?: string;
}

/** 인피드 네이티브 광고 — 서비스 카드 그리드 안에 삽입 */
export function AdInFeed({ className }: AdInFeedProps) {
  const { adInfeedLayoutKey } = useSiteSettings();

  return (
    <AdSlot
      slotKey="IN_FEED"
      variant="infeed"
      adFormat="fluid"
      adLayoutKey={adInfeedLayoutKey}
      className={cn('h-full min-h-[250px] sm:col-span-1', className)}
    />
  );
}
