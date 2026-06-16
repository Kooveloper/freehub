'use client';

import { Heart } from 'lucide-react';
import { useState } from 'react';

import { useFavorites } from '@/hooks/useFavorites';
import { trackFavoriteAdd, trackFavoriteRemove } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  toolId: string;
  toolName?: string;
  className?: string;
  size?: 'sm' | 'md';
}

const SIZE_MAP = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
} as const;

const BUTTON_SIZE_MAP = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
} as const;

/** 즐겨찾기 토글 버튼 */
export function FavoriteButton({
  toolId,
  toolName,
  className,
  size = 'md',
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [bouncing, setBouncing] = useState(false);

  const favorited = isFavorite(toolId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setBouncing(true);
    setTimeout(() => setBouncing(false), 200);

    const wasFavorite = favorited;
    await toggleFavorite(toolId);

    if (toolName) {
      if (wasFavorite) {
        trackFavoriteRemove(toolName);
      } else {
        trackFavoriteAdd(toolName);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex items-center justify-center rounded-full transition-all duration-200',
        'hover:bg-gray-100',
        bouncing && 'scale-125',
        BUTTON_SIZE_MAP[size],
        className,
      )}
      aria-label={favorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
    >
      <Heart
        className={cn(
          'transition-colors duration-200',
          SIZE_MAP[size],
          favorited
            ? 'fill-red-500 text-red-500'
            : 'fill-none text-gray-400',
        )}
      />
    </button>
  );
}
