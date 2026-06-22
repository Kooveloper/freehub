'use client';

import { trackToolClickExternal } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface ExternalToolLinkProps {
  toolName: string;
  href: string;
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
  className,
  trackingClass,
  children,
}: ExternalToolLinkProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    trackToolClickExternal(toolName, href);

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
