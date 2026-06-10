import Image from 'next/image';

import { cn } from '@/lib/utils';

interface ToolLogoProps {
  name: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
  imageClassName?: string;
}

/** 툴 로고 — next/image + 로고 없을 때 이니셜 폴백 */
export function ToolLogo({
  name,
  logoUrl,
  size = 48,
  className,
  imageClassName,
}: ToolLogoProps) {
  const initial = name.charAt(0).toUpperCase();

  if (!logoUrl) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50',
          className,
        )}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <span
          className="font-bold text-gray-400"
          style={{ fontSize: Math.max(12, Math.round(size * 0.375)) }}
        >
          {initial}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={logoUrl}
        alt={`${name} 로고`}
        width={48}
        height={48}
        unoptimized
        className={cn('h-full w-full object-contain', imageClassName)}
      />
    </div>
  );
}
