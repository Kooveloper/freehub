'use client';

import { useEffect } from 'react';

interface BlogViewTrackerProps {
  postId: string;
}

/** 블로그 상세 조회수 증가 (IP당 24시간 1회) */
export function BlogViewTracker({ postId }: BlogViewTrackerProps) {
  useEffect(() => {
    fetch('/api/blog/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    }).catch(() => {
      // 조회수 실패는 UX에 영향 없음
    });
  }, [postId]);

  return null;
}
