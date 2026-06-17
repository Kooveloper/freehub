'use client';

import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function StarRatingDisplay({
  value,
  max = 5,
  size = 'md',
  className,
}: StarRatingProps) {
  const iconClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className={cn('flex gap-0.5', className)} aria-label={`${value}점`}>
      {Array.from({ length: max }).map((_, index) => {
        const filled = index < Math.round(value);
        return (
          <Star
            key={index}
            className={cn(
              iconClass,
              filled ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200',
            )}
          />
        );
      })}
    </div>
  );
}

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function StarRatingInput({ value, onChange, disabled }: StarRatingInputProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const filled = starValue <= value;
        return (
          <button
            key={starValue}
            type="button"
            disabled={disabled}
            onClick={() => onChange(starValue)}
            className="rounded p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
            aria-label={`${starValue}점`}
          >
            <Star
              className={cn(
                'h-6 w-6',
                filled ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
