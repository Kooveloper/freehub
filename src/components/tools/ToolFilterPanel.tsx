'use client';

import { cn } from '@/lib/utils';

import type { SortOption } from './ToolFilter';

const LIMIT_FILTERS = [
  { key: 'daily', labelKo: '일별 한도', labelEn: 'Daily limit' },
  { key: 'monthly', labelKo: '월별 한도', labelEn: 'Monthly limit' },
  { key: 'unlimited', labelKo: '무제한', labelEn: 'Unlimited' },
] as const;

const SORT_OPTIONS = [
  { key: 'popular' as const, labelKo: '인기순', labelEn: 'Popular' },
  { key: 'updated' as const, labelKo: '최근 업데이트', labelEn: 'Recently updated' },
  { key: 'name' as const, labelKo: '이름순', labelEn: 'Name' },
];

interface ToolFilterPanelProps {
  activeFilters: Set<string>;
  sort: SortOption;
  onToggleFilter: (key: string) => void;
  onSetSort: (key: SortOption) => void;
  locale?: 'ko' | 'en';
  className?: string;
}

export function ToolFilterPanel({
  activeFilters,
  sort,
  onToggleFilter,
  onSetSort,
  locale = 'ko',
  className,
}: ToolFilterPanelProps) {
  const isEn = locale === 'en';

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-4 shadow-sm',
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <FilterGroup label={isEn ? 'Limit type' : '한도 유형'}>
          {LIMIT_FILTERS.map(({ key, labelKo, labelEn }) => (
            <Checkbox
              key={key}
              id={`limit-${key}`}
              label={isEn ? labelEn : labelKo}
              checked={activeFilters.has(key)}
              onChange={() => onToggleFilter(key)}
            />
          ))}
        </FilterGroup>

        <div className="shrink-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {isEn ? 'Sort' : '정렬'}
          </p>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map(({ key, labelKo, labelEn }) => (
              <button
                key={key}
                type="button"
                onClick={() => onSetSort(key)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  sort === key
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                {isEn ? labelEn : labelKo}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-2">{children}</div>
    </div>
  );
}

function Checkbox({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
      />
      {label}
    </label>
  );
}
