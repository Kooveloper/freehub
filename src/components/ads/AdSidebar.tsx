'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useAdsActive } from '@/hooks/useAdsActive';

import { AdSlot } from './AdSlot';

/** 세로형 사이드바 광고 (160×600), sticky + 뷰포트 진입 시 lazy load */
export function AdSidebar() {
  const active = useAdsActive();
  const containerRef = useRef<HTMLElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [hidden, setHidden] = useState(false);
  const handleLoadError = useCallback(() => setHidden(true), []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || hidden || !active) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hidden, active]);

  if (!active || hidden) return null;

  return (
    <aside
      ref={containerRef}
      className="sticky top-24 hidden shrink-0 md:block"
    >
      {shouldLoad && (
        <AdSlot
          slotKey="SIDEBAR"
          variant="sidebar"
          fullWidthResponsive={false}
          style={{ display: 'inline-block', width: 160, height: 600 }}
          onLoadError={handleLoadError}
        />
      )}
    </aside>
  );
}
