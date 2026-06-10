'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

import { cn } from '@/lib/utils';

const LIMIT_FILTERS = [
  { key: 'daily', label: '일별 한도' },
  { key: 'monthly', label: '월별 한도' },
  { key: 'unlimited', label: '무제한' },
] as const;

const SORT_OPTIONS = [
  { key: 'popular', label: '인기순' },
  { key: 'updated', label: '최근 업데이트' },
  { key: 'name', label: '이름순' },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]['key'];

function parseFilters(param: string | null): Set<string> {
  if (!param) return new Set();
  return new Set(param.split(',').filter(Boolean));
}

/** URL searchParams 기반 툴 필터 패널 */
export function ToolFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeFilters = parseFilters(searchParams.get('filter'));
  const sort = (searchParams.get('sort') as SortOption) || 'popular';

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      // 필터·정렬 변경 시 1페이지로
      if ('filter' in updates || 'sort' in updates) {
        params.delete('page');
      }

      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname);
      });
    },
    [pathname, router, searchParams],
  );

  const toggleFilter = (key: string) => {
    const next = new Set(activeFilters);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    const value = next.size > 0 ? Array.from(next).join(',') : null;
    updateParams({ filter: value });
  };

  const setSort = (key: SortOption) => {
    updateParams({ sort: key === 'popular' ? null : key });
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-4 shadow-sm',
        isPending && 'opacity-70',
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* 필터 */}
        <FilterGroup label="한도 유형">
          {LIMIT_FILTERS.map(({ key, label }) => (
            <Checkbox
              key={key}
              id={`limit-${key}`}
              label={label}
              checked={activeFilters.has(key)}
              onChange={() => toggleFilter(key)}
            />
          ))}
        </FilterGroup>

        {/* 정렬 */}
        <div className="shrink-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            정렬
          </p>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSort(key)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  sort === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                {label}
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
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      {label}
    </label>
  );
}
