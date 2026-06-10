'use client';

import { trackToolClickExternal } from '@/lib/analytics';

interface ExternalToolLinkProps {
  toolName: string;
  href: string;
  className?: string;
  children: React.ReactNode;
}

const NAVIGATION_DELAY_MS = 100;

/** 외부 툴 링크 클릭 GA4 추적 후 이동 */
export function ExternalToolLink({
  toolName,
  href,
  className,
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
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
