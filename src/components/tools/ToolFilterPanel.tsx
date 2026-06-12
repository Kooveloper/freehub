'use client';

import { cn } from '@/lib/utils';

import { ToolFilterBar } from './ToolFilterBar';
import type { SortOption } from './tool-filter-options';

export type { SortOption } from './tool-filter-options';

interface ToolFilterPanelProps {
  activeFilters: Set<string>;
  sort: SortOption;
  onToggleFilter: (key: string) => void;
  onSetSort: (key: SortOption) => void;
  onClearFilters?: () => void;
  locale?: 'ko' | 'en';
  className?: string;
}

export function ToolFilterPanel({
  activeFilters,
  sort,
  onToggleFilter,
  onSetSort,
  onClearFilters,
  locale = 'ko',
  className,
}: ToolFilterPanelProps) {
  const clearFilters = () => {
    if (onClearFilters) {
      onClearFilters();
      return;
    }
    for (const key of activeFilters) {
      onToggleFilter(key);
    }
  };

  return (
    <ToolFilterBar
      activeFilters={activeFilters}
      sort={sort}
      onToggleFilter={onToggleFilter}
      onClearFilters={clearFilters}
      onSetSort={onSetSort}
      locale={locale}
      className={cn(className)}
    />
  );
}
