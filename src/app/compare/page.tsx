'use client';

import { ExternalLink, Plus, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { ExternalToolLink } from '@/components/tool/ExternalToolLink';
import { ToolLogo } from '@/components/ui/ToolLogo';
import { useLocale } from '@/contexts/LocaleContext';
import { cn, formatFreeLimit } from '@/lib/utils';
import type { Category, Tool } from '@/types/tool';

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

function ComparePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const slugs = parseToolSlugs(searchParams.get('tools'));

  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryTools, setCategoryTools] = useState<Tool[]>([]);
  const [loadingCategoryTools, setLoadingCategoryTools] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Tool[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => setCategories([]));
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

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!showSearch || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery.trim())}&limit=8`,
        );
        if (!response.ok) return;
        const data = (await response.json()) as { tools: Tool[] };
        const selected = new Set(slugs);
        setSearchResults(
          (data.tools ?? []).filter((tool) => !selected.has(tool.slug)),
        );
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, showSearch, slugs.join(',')]);

  const getCategoryName = (slug: string) =>
    categories.find((c) => c.slug === slug)?.name ?? slug;

  const getCompareCellValue = (
    tool: Tool,
    rowKey: (typeof COMPARE_ROWS)[number]['key'],
  ) => {
    switch (rowKey) {
      case 'category':
        return getCategoryName(tool.category_slug);
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
  const availableCategoryTools = categoryTools.filter(
    (tool) => !selectedSet.has(tool.slug),
  );

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

      {canAddMore && (
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-gray-900">
            {locale === 'en' ? '1. Choose a category' : '1. 카테고리 선택'}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.slug}
                type="button"
                onClick={() => {
                  setSelectedCategory(category.slug);
                  setShowSearch(false);
                }}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-bold transition-colors',
                  selectedCategory === category.slug
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                )}
              >
                {category.name}
              </button>
            ))}
          </div>

          {selectedCategory && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-900">
                {locale === 'en' ? '2. Select a tool' : '2. 툴 선택'}
              </h3>
              {loadingCategoryTools ? (
                <p className="mt-4 text-sm text-gray-400">
                  {locale === 'en' ? 'Loading…' : '불러오는 중…'}
                </p>
              ) : availableCategoryTools.length === 0 ? (
                <p className="mt-4 text-sm text-gray-400">
                  {locale === 'en'
                    ? 'No more tools in this category.'
                    : '선택 가능한 툴이 없습니다.'}
                </p>
              ) : (
                <ul className="mt-3 max-h-72 overflow-auto rounded-lg border border-gray-100">
                  {availableCategoryTools.map((tool) => (
                    <li key={tool.id}>
                      <button
                        type="button"
                        onClick={() => addTool(tool)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-blue-50"
                      >
                        <ToolLogo
                          name={tool.name}
                          logoUrl={tool.logo_url}
                          size={32}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {tool.name}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {tool.description}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 shrink-0 text-blue-600" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="mt-6 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => setShowSearch((prev) => !prev)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              {locale === 'en'
                ? showSearch
                  ? 'Hide search'
                  : 'Search by name instead'
                : showSearch
                  ? '검색 닫기'
                  : '이름으로 검색하기 (부가)'}
            </button>
            {showSearch && (
              <div className="mt-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      locale === 'en' ? 'Search tools…' : '툴 이름 검색…'
                    }
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                {searchResults.length > 0 && (
                  <ul className="mt-2 max-h-48 overflow-auto rounded-lg border border-gray-100">
                    {searchResults.map((tool) => (
                      <li key={tool.id}>
                        <button
                          type="button"
                          onClick={() => addTool(tool)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-gray-50"
                        >
                          <ToolLogo
                            name={tool.name}
                            logoUrl={tool.logo_url}
                            size={28}
                          />
                          <span className="truncate text-sm font-medium">
                            {tool.name}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
                ? 'Pick a category above, then select tools.'
                : '위에서 카테고리를 선택한 뒤 툴을 추가하세요.'}
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
                              className="block truncate font-bold text-gray-900 hover:text-blue-600"
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
