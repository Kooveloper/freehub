'use client';

import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import {
  LIMIT_FILTER_OPTIONS,
  SORT_OPTIONS,
  type SortOption,
} from './tool-filter-options';

interface ToolFilterBarProps {
  activeFilters: Set<string>;
  sort: SortOption;
  onToggleFilter: (key: string) => void;
  onClearFilters: () => void;
  onSetSort: (key: SortOption) => void;
  locale?: 'ko' | 'en';
  className?: string;
  disabled?: boolean;
  filterMenuAlign?: 'left' | 'right';
  compact?: boolean;
  /** 타이틀 옆 등 좁은 공간용 — 더 작은 패딩·폭 */
  dense?: boolean;
}

export function ToolFilterBar({
  activeFilters,
  sort,
  onToggleFilter,
  onClearFilters,
  onSetSort,
  locale = 'ko',
  className,
  disabled,
  filterMenuAlign = 'left',
  compact = false,
  dense = false,
}: ToolFilterBarProps) {
  const isEn = locale === 'en';
  const sortId = useId();
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const activeCount = activeFilters.size;

  useEffect(() => {
    if (!filterOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [filterOpen]);

  return (
    <div
      className={cn(
        'flex items-center',
        dense ? 'gap-1' : 'gap-2 sm:gap-3',
        disabled && 'pointer-events-none opacity-60',
        className,
      )}
    >
      <div className="relative shrink-0" ref={filterRef}>
        <button
          type="button"
          aria-expanded={filterOpen}
          aria-haspopup="true"
          aria-label={isEn ? 'Filter' : '필터'}
          onClick={() => setFilterOpen((open) => !open)}
          className={cn(
            'inline-flex items-center rounded-lg border font-medium transition-colors',
            dense
              ? 'gap-1 px-2 py-1.5 text-xs'
              : 'gap-1.5 px-3 py-2 text-sm',
            activeCount > 0
              ? 'border-neutral-900 bg-neutral-900 text-white'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
          )}
        >
          <SlidersHorizontal
            className={cn('shrink-0', dense ? 'h-3.5 w-3.5' : 'h-4 w-4')}
            aria-hidden
          />
          {!dense && <span>{isEn ? 'Filter' : '필터'}</span>}
          {activeCount > 0 && (
            <span
              className={cn(
                'rounded-full text-center font-semibold',
                dense
                  ? 'min-w-[1rem] px-1 text-[10px]'
                  : 'min-w-[1.25rem] px-1.5 text-xs',
                activeCount > 0 ? 'bg-white/20' : 'bg-gray-100 text-gray-600',
              )}
            >
              {activeCount}
            </span>
          )}
          {!dense && (
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 transition-transform',
                filterOpen && 'rotate-180',
              )}
              aria-hidden
            />
          )}
        </button>

        {filterOpen && (
          <div
            role="dialog"
            aria-label={isEn ? 'Limit type filter' : '한도 유형 필터'}
            className={cn(
              'absolute top-[calc(100%+0.375rem)] z-30 rounded-xl border border-gray-200 bg-white p-3 shadow-lg',
              dense
                ? 'w-[min(100vw-2rem,14rem)]'
                : 'w-[min(100vw-2rem,16rem)]',
              filterMenuAlign === 'right' ? 'right-0' : 'left-0',
            )}
          >
            <p className="mb-2 text-xs font-semibold text-gray-500">
              {isEn ? 'Limit type' : '한도 유형'}
            </p>
            <ul className="space-y-1">
              {LIMIT_FILTER_OPTIONS.map(({ key, labelKo, labelEn }) => {
                const checked = activeFilters.has(key);
                const label = isEn ? labelEn : labelKo;

                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => onToggleFilter(key)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                        checked
                          ? 'bg-neutral-900 text-white'
                          : 'text-gray-700 hover:bg-gray-50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold',
                          checked
                            ? 'border-white bg-white text-neutral-900'
                            : 'border-gray-300 bg-white',
                        )}
                        aria-hidden
                      >
                        {checked ? '✓' : ''}
                      </span>
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClearFilters();
                  setFilterOpen(false);
                }}
                className="mt-2 w-full rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                {isEn ? 'Clear filters' : '필터 초기화'}
              </button>
            )}
          </div>
        )}
      </div>

      <div
        className={cn(
          'relative shrink-0',
          dense
            ? 'w-[5.75rem]'
            : compact
              ? 'w-[9.5rem]'
              : 'min-w-0 flex-1 sm:w-[9.5rem]',
        )}
      >
        <label htmlFor={sortId} className="sr-only">
          {isEn ? 'Sort' : '정렬'}
        </label>
        <select
          id={sortId}
          value={sort}
          onChange={(event) => onSetSort(event.target.value as SortOption)}
          className={cn(
            'w-full appearance-none rounded-lg border border-gray-200 bg-white font-medium text-gray-700',
            'focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10',
            dense
              ? 'py-1.5 pl-2 pr-6 text-xs'
              : 'py-2 pl-3 pr-9 text-sm',
          )}
        >
          {SORT_OPTIONS.map(({ key, labelKo, labelEn }) => (
            <option key={key} value={key}>
              {isEn ? labelEn : labelKo}
            </option>
          ))}
        </select>
        <ChevronDown
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400',
            dense
              ? 'right-1.5 h-3.5 w-3.5'
              : 'right-2.5 h-4 w-4',
          )}
          aria-hidden
        />
      </div>
    </div>
  );
}
