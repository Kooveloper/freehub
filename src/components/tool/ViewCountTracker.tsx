'use client';

import { useEffect, useRef } from 'react';

import { trackToolView } from '@/lib/analytics';

interface ViewCountTrackerProps {
  toolId: string;
  toolName: string;
  category: string;
}

/** 페이지 하단에서 조회수 1회 증가 + GA4 tool_view */
export function ViewCountTracker({
  toolId,
  toolName,
  category,
}: ViewCountTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    trackToolView(toolName, category);

    fetch('/api/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId }),
    }).catch(() => {
      // 조회수 실패는 UX에 영향 없음
    });
  }, [toolId, toolName, category]);

  return null;
}
