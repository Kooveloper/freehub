import Image from 'next/image';
import { Zap } from 'lucide-react';

import { isCategoryIconImage } from '@/lib/category-icon';
import { CATEGORY_ICON_MAP } from '@/lib/category-icons';
import { cn } from '@/lib/utils';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

/** 카테고리 아이콘 — 이미지 URL / 이모지 / Lucide(레거시) 지원 */
export function CategoryIcon({
  name,
  className,
  size = 24,
}: CategoryIconProps) {
  const icon = name.trim();

  if (!icon) {
    return <Zap className={className} />;
  }

  if (isCategoryIconImage(icon)) {
    return (
      <Image
        src={icon}
        alt=""
        width={size}
        height={size}
        className={cn('object-contain', className)}
        unoptimized
      />
    );
  }

  const LucideIcon = CATEGORY_ICON_MAP[icon];
  if (LucideIcon) {
    return <LucideIcon className={className} />;
  }

  return (
    <span
      className={cn('leading-none select-none', className)}
      style={{ fontSize: Math.round(size * 0.85) }}
      aria-hidden
    >
      {icon}
    </span>
  );
}
