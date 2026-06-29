'use client';

import { trackToolClickExternal } from '@/lib/analytics';
import type { ToolClickType } from '@/types/tool-analytics';
import { cn } from '@/lib/utils';

interface ExternalToolLinkProps {
  toolName: string;
  href: string;
  toolId?: string;
  clickType?: ToolClickType;
  className?: string;
  /** GTM · Google Ads 클릭 트리거용 class */
  trackingClass?: string;
  children: React.ReactNode;
}

const NAVIGATION_DELAY_MS = 100;

/** 외부 툴 링크 클릭 GA4 추적 후 이동 */
export function ExternalToolLink({
  toolName,
  href,
  toolId,
  clickType,
  className,
  trackingClass,
  children,
}: ExternalToolLinkProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    trackToolClickExternal(toolName, href);

    if (toolId && clickType) {
      fetch('/api/clicks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, clickType }),
      }).catch(() => {
        // 클릭 집계 실패는 UX에 영향 없음
      });
    }

    window.setTimeout(() => {
      window.open(href, '_blank', 'noopener,noreferrer');
    }, NAVIGATION_DELAY_MS);
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(className, trackingClass)}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
