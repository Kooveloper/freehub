import Link from 'next/link';

import { cn } from '@/lib/utils';

const SIZE_CLASS = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
} as const;

interface BrandLogoProps {
  className?: string;
  size?: keyof typeof SIZE_CLASS;
  href?: string;
}

export function BrandLogo({
  className,
  size = 'md',
  href = '/',
}: BrandLogoProps) {
  const label = (
    <span
      className={cn('font-extrabold uppercase tracking-tight', SIZE_CLASS[size])}
    >
      FREEHUB
    </span>
  );

  if (!href) {
    return (
      <span className={cn('inline-block', className)}>
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn('inline-block transition-colors', className)}
    >
      {label}
    </Link>
  );
}
