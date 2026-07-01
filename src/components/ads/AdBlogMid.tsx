'use client';

import { AdSlot } from '@/components/ads/AdSlot';

/** 블로그 본문 중간 인아티클 광고 */
export function AdBlogMid() {
  return (
    <div
      className="not-prose my-10 w-full"
      aria-label="광고"
    >
      <AdSlot
        slotKey="BLOG_MID"
        variant="inarticle"
        adFormat="fluid"
        adLayout="in-article"
        className="w-full min-h-[120px]"
        fullWidthResponsive
      />
    </div>
  );
}
