'use client';

import { useEffect } from 'react';

import { trackSearch } from '@/lib/analytics';

interface SearchAnalyticsProps {
  query: string;
  resultCount: number;
}

/** 검색 결과 페이지 GA4 검색 이벤트 */
export function SearchAnalytics({ query, resultCount }: SearchAnalyticsProps) {
  useEffect(() => {
    trackSearch(query, resultCount);
  }, [query, resultCount]);

  return null;
}
