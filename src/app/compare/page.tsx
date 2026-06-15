'use client';

import { ExternalLink, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { ExternalToolLink } from '@/components/tool/ExternalToolLink';
import { ToolLogo } from '@/components/ui/ToolLogo';
import { useLocale } from '@/contexts/LocaleContext';
import { toolInSubCategory } from '@/lib/tool-categories';
import {
  buildSubCategoryNameMap,
  groupSubCategoriesByCategory,
  localizeSubCategories,
} from '@/lib/sub-categories';
import { cn, formatFreeLimit } from '@/lib/utils';
import type { Category, SubCategory, Tool } from '@/types/tool';

const MAX_COMPARE = 3;

const COMPARE_ROWS = [
  { key: 'category', labelKo: '카테고리', labelEn: 'Category' },
  { key: 'free_plan', labelKo: '무료 플랜', labelEn: 'Free plan' },
  { key: 'free_limit', labelKo: '무료 한도', labelEn: 'Free limit' },
  { key: 'free_features', labelKo: '무료 기능', labelEn: 'Free features' },
  { key: 'paid_features', labelKo: '유료 전용 기능', labelEn: 'Paid only' },
] as const;

function parseToolSlugs(toolsParam: string | null): string[] {
  if (!toolsParam) return [];
  return toolsParam
    .split(',')
    .map((slug) => slug.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPARE);
}

function FeatureList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className="text-gray-400">—</span>;
  }
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-700"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function PillRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'scrollbar-hide -mx-5 overflow-x-auto overscroll-x-contain px-5',
        '[-webkit-overflow-scrolling:touch]',
        'sm:mx-0 sm:overflow-visible sm:px-0',
        className,
      )}
    >
      <div className="flex w-max flex-nowrap gap-2 sm:w-auto sm:flex-wrap">
        {children}
      </div>
    </div>
  );
}

function CompareToolCard({
  tool,
  subLabel,
  selected = false,
  onClick,
  disabled = false,
}: {
  tool: Tool;
  subLabel?: string;
  selected?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex aspect-square w-[7.25rem] shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-2.5 text-center transition-all sm:w-[8rem]',
        selected
          ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm',
        disabled && !selected && 'cursor-not-allowed opacity-40',
      )}
    >
      <ToolLogo
        name={tool.name}
        logoUrl={tool.logo_url}
        size={40}
        className={cn(
          'rounded-xl',
          selected ? 'ring-2 ring-white/25' : 'ring-1 ring-gray-100',
        )}
      />
      <span className="line-clamp-2 w-full text-xs font-semibold leading-tight">
        {tool.name}
      </span>
      {subLabel ? (
        <span
          className={cn(
            'line-clamp-1 w-full text-[10px] leading-tight',
            selected ? 'text-neutral-300' : 'text-gray-400',
          )}
        >
          {subLabel}
        </span>
      ) : null}
    </button>
  );
}

function CompareToolCardSkeleton({ slug }: { slug: string }) {
  return (
    <div
      key={slug}
      className="aspect-square w-[7.25rem] shrink-0 animate-pulse rounded-xl bg-gray-100 sm:w-[8rem]"
    />
  );
}

function ComparePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const slugs = parseToolSlugs(searchParams.get('tools'));

  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    null,
  );
  const [categoryTools, setCategoryTools] = useState<Tool[]>([]);
  const [loadingCategoryTools, setLoadingCategoryTools] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Tool[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const subByCategory = useMemo(
    () => groupSubCategoriesByCategory(subCategories),
    [subCategories],
  );
  const localizedSubByCategory = useMemo(() => {
    const localized: Record<string, SubCategory[]> = {};
    for (const [slug, subs] of Object.entries(subByCategory)) {
      localized[slug] = localizeSubCategories(subs, locale);
    }
    return localized;
  }, [subByCategory, locale]);
  const subNameMap = useMemo(
    () => buildSubCategoryNameMap(subCategories, locale),
    [subCategories, locale],
  );

  const updateSlugs = useCallback(
    (nextSlugs: string[]) => {
      if (nextSlugs.length === 0) setTools([]);
      const params = new URLSearchParams(searchParams.toString());
      if (nextSlugs.length === 0) params.delete('tools');
      else params.set('tools', nextSlugs.join(','));
      const queryString = params.toString();
      router.replace(queryString ? `/compare?${queryString}` : '/compare', {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const addTool = useCallback(
    (tool: Tool) => {
      if (slugs.includes(tool.slug) || slugs.length >= MAX_COMPARE) return;
      updateSlugs([...slugs, tool.slug]);
    },
    [slugs, updateSlugs],
  );

  const removeTool = useCallback(
    (slug: string) => updateSlugs(slugs.filter((item) => item !== slug)),
    [slugs, updateSlugs],
  );

  const toggleTool = useCallback(
    (tool: Tool) => {
      if (slugs.includes(tool.slug)) {
        removeTool(tool.slug);
      } else if (slugs.length < MAX_COMPARE) {
        addTool(tool);
      }
    },
    [slugs, addTool, removeTool],
  );

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((res) => res.json()),
      fetch('/api/sub-categories').then((res) => res.json()),
    ])
      .then(([catData, subData]) => {
        setCategories(catData.categories ?? []);
        setSubCategories(subData.subCategories ?? []);
      })
      .catch(() => {
        setCategories([]);
        setSubCategories([]);
      });
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setCategoryTools([]);
      return;
    }
    setLoadingCategoryTools(true);
    fetch(`/api/categories/${selectedCategory}/tools`)
      .then((res) => res.json())
      .then((data) => setCategoryTools(data.tools ?? []))
      .catch(() => setCategoryTools([]))
      .finally(() => setLoadingCategoryTools(false));
  }, [selectedCategory]);

  const slugsKey = slugs.join(',');

  useEffect(() => {
    if (!slugsKey) return;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/compare?tools=${encodeURIComponent(slugsKey)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error('load failed');
        const data = (await response.json()) as { tools: Tool[] };
        setTools(data.tools ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setTools([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [slugsKey]);

  const runSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) {
        setSearchQuery('');
        setSearchResults([]);
        return;
      }

      setSearchQuery(trimmed);
      setSearchLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&limit=20`,
        );
        if (!response.ok) {
          setSearchResults([]);
          return;
        }
        const data = (await response.json()) as { tools: Tool[] };
        const selected = new Set(slugs);
        setSearchResults(
          (data.tools ?? []).filter((tool) => !selected.has(tool.slug)),
        );
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [slugs],
  );

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    runSearch(searchInput);
  };

  const getCategoryLabel = (tool: Tool) => {
    const categoryName =
      categories.find((c) => c.slug === tool.category_slug)?.name ??
      tool.category_slug;
    const subName = tool.sub_category
      ? subNameMap[tool.sub_category]
      : undefined;
    return subName ? `${categoryName} · ${subName}` : categoryName;
  };

  const getCompareCellValue = (
    tool: Tool,
    rowKey: (typeof COMPARE_ROWS)[number]['key'],
  ) => {
    switch (rowKey) {
      case 'category':
        return getCategoryLabel(tool);
      case 'free_plan':
        return tool.free_plan_exists
          ? locale === 'en'
            ? 'Yes'
            : '있음'
          : locale === 'en'
            ? 'No'
            : '없음';
      case 'free_limit':
        return tool.free_plan_exists
          ? formatFreeLimit(
              tool.free_limit_type,
              tool.free_limit_amount,
              tool.free_limit_unit,
              locale,
            )
          : '—';
      case 'free_features':
        return tool.free_features;
      case 'paid_features':
        return tool.paid_only_features;
      default:
        return '—';
    }
  };

  const canAddMore = slugs.length < MAX_COMPARE;
  const selectedSet = new Set(slugs);
  const activeSubCategories = selectedCategory
    ? (localizedSubByCategory[selectedCategory] ?? [])
    : [];

  const availableCategoryTools = useMemo(() => {
    let list = categoryTools.filter((tool) => !selectedSet.has(tool.slug));
    if (selectedSubCategory && selectedCategory) {
      list = list.filter((tool) =>
        toolInSubCategory(tool, selectedCategory, selectedSubCategory),
      );
    }
    return list;
  }, [categoryTools, selectedSubCategory, selectedSet]);

  const selectCategory = (slug: string) => {
    setSelectedCategory(slug);
    setSelectedSubCategory(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {locale === 'en' ? 'Compare tools' : '툴 비교'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {locale === 'en'
            ? `Compare up to ${MAX_COMPARE} tools side by side.`
            : `최대 ${MAX_COMPARE}개까지 무료 플랜과 기능을 나란히 비교할 수 있습니다.`}
        </p>
      </div>

      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {slugs.length > 0 && (
          <div className="mb-6 border-b border-gray-100 pb-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-gray-900">
                {locale === 'en' ? 'Selected tools' : '선택된 툴'}{' '}
                <span className="font-medium text-gray-400">
                  ({slugs.length}/{MAX_COMPARE})
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                {locale === 'en' ? 'Tap to deselect' : '탭하여 선택 해제'}
              </p>
            </div>
            <div className="scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {loading && tools.length === 0
                ? slugs.map((slug) => (
                    <CompareToolCardSkeleton key={slug} slug={slug} />
                  ))
                : tools.map((tool) => (
                    <CompareToolCard
                      key={tool.id}
                      tool={tool}
                      subLabel={getCategoryLabel(tool)}
                      selected
                      onClick={() => toggleTool(tool)}
                    />
                  ))}
            </div>
          </div>
        )}

        {canAddMore ? (
          <>
          <form onSubmit={handleSearchSubmit} className="mb-6">
            <label
              htmlFor="compare-search"
              className="mb-2 block text-sm font-bold text-gray-900"
            >
              {locale === 'en' ? 'Search tools' : '툴 검색'}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="compare-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={
                  locale === 'en'
                    ? 'Enter a keyword and press Enter'
                    : '키워드를 입력하고 Enter'
                }
                className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
              {locale === 'en'
                ? 'Name, description, or tags containing your keyword'
                : '이름·설명·태그에 키워드가 포함된 툴을 검색합니다'}
            </p>
          </form>

          {searchLoading && (
            <p className="mb-4 text-sm text-gray-400">
              {locale === 'en' ? 'Searching…' : '검색 중…'}
            </p>
          )}

          {!searchLoading && searchQuery && (
            <div className="mb-6">
              {searchResults.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {locale === 'en'
                    ? `No results for "${searchQuery}".`
                    : `"${searchQuery}"에 대한 검색 결과가 없습니다.`}
                </p>
              ) : (
                <div className="scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                  {searchResults.map((tool) => (
                    <CompareToolCard
                      key={tool.id}
                      tool={tool}
                      subLabel={getCategoryLabel(tool)}
                      onClick={() => toggleTool(tool)}
                      disabled={slugs.length >= MAX_COMPARE}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="border-t border-gray-100 pt-6">
            <h2 className="text-base font-bold text-gray-900">
              {locale === 'en' ? 'Browse by category' : '카테고리에서 선택'}
            </h2>

            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {locale === 'en' ? 'Category' : '대카테고리'}
            </p>
            <PillRow className="mt-2">
              {categories.map((category) => (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() => selectCategory(category.slug)}
                  className={cn(
                    'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                    selectedCategory === category.slug
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                  )}
                >
                  {category.name}
                </button>
              ))}
            </PillRow>

            {selectedCategory && activeSubCategories.length > 0 && (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {locale === 'en' ? 'Subcategory' : '하위 카테고리'}
                </p>
                <PillRow className="mt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSubCategory(null)}
                    className={cn(
                      'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                      selectedSubCategory === null
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                    )}
                  >
                    {locale === 'en' ? 'All' : '전체'}
                  </button>
                  {activeSubCategories.map((sub) => (
                    <button
                      key={sub.slug}
                      type="button"
                      onClick={() => setSelectedSubCategory(sub.slug)}
                      className={cn(
                        'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                        selectedSubCategory === sub.slug
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                      )}
                    >
                      {sub.name}
                    </button>
                  ))}
                </PillRow>
              </>
            )}

            {selectedCategory && (
              <div className="mt-5">
                <h3 className="text-sm font-bold text-gray-900">
                  {locale === 'en' ? 'Select a tool' : '툴 선택'}
                </h3>
                {loadingCategoryTools ? (
                  <p className="mt-4 text-sm text-gray-400">
                    {locale === 'en' ? 'Loading…' : '불러오는 중…'}
                  </p>
                ) : availableCategoryTools.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-400">
                    {locale === 'en'
                      ? 'No tools available for this selection.'
                      : '선택한 조건에 해당하는 툴이 없습니다.'}
                  </p>
                ) : (
                  <div className="scrollbar-hide -mx-1 mt-3 flex gap-3 overflow-x-auto px-1 pb-2">
                    {availableCategoryTools.map((tool) => (
                      <CompareToolCard
                        key={tool.id}
                        tool={tool}
                        subLabel={
                          tool.sub_category
                            ? subNameMap[tool.sub_category]
                            : undefined
                        }
                        onClick={() => toggleTool(tool)}
                        disabled={slugs.length >= MAX_COMPARE}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">
            {locale === 'en'
              ? `Maximum ${MAX_COMPARE} tools selected. Tap a card above to remove one.`
              : `최대 ${MAX_COMPARE}개까지 선택되었습니다. 위 카드를 탭하여 해제할 수 있습니다.`}
          </p>
        )}
      </div>

      <div>
        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-400">
            {locale === 'en' ? 'Loading comparison…' : '비교 데이터를 불러오는 중…'}
          </div>
        ) : tools.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center">
            <p className="text-lg font-bold text-gray-700">
              {locale === 'en'
                ? 'Add tools to compare'
                : '비교할 툴을 추가해보세요'}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {locale === 'en'
                ? 'Search above or pick a category.'
                : '위에서 검색하거나 카테고리를 선택하세요.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="sticky left-0 z-10 w-36 bg-gray-50 px-4 py-4 text-left font-bold text-gray-500">
                    {locale === 'en' ? 'Item' : '항목'}
                  </th>
                  {tools.map((tool) => (
                    <th
                      key={tool.id}
                      className="min-w-[200px] px-4 py-4 text-left align-top"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <ToolLogo
                              name={tool.name}
                              logoUrl={tool.logo_url}
                              size={40}
                            />
                            <Link
                              href={`/tool/${tool.slug}`}
                              className="block truncate font-bold text-gray-900 hover:text-neutral-700"
                            >
                              {tool.name}
                            </Link>
                          </div>
                          <ExternalToolLink
                            toolName={tool.name}
                            href={tool.homepage_url}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            {locale === 'en' ? 'Official site' : '공식 사이트'}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </ExternalToolLink>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTool(tool.slug)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          aria-label={`${tool.name} remove`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <th className="sticky left-0 z-10 bg-white px-4 py-4 text-left font-bold text-gray-700">
                      {locale === 'en' ? row.labelEn : row.labelKo}
                    </th>
                    {tools.map((tool) => {
                      const value = getCompareCellValue(tool, row.key);
                      const isFeatureList =
                        row.key === 'free_features' ||
                        row.key === 'paid_features';
                      return (
                        <td
                          key={`${tool.id}-${row.key}`}
                          className="px-4 py-4 align-top text-gray-700"
                        >
                          {isFeatureList ? (
                            <FeatureList items={value as string[]} />
                          ) : (
                            value
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ComparePageFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-400">
        …
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<ComparePageFallback />}>
      <ComparePageContent />
    </Suspense>
  );
}
