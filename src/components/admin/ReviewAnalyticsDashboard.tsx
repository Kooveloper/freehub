'use client';

import { BarChart3, Loader2, Search, Star } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ReviewListModal,
  type ReviewListFilter,
} from '@/components/admin/ReviewListModal';
import { ReviewLatestTable } from '@/components/admin/ReviewLatestTable';
import type { AdminReviewAnalyticsData } from '@/lib/admin/review-analytics';
import type { AnalyticsPeriod } from '@/lib/admin/analytics';
import { ADMIN_DASHBOARD_TABLE_CLASS } from '@/components/admin/admin-table';
import { cn } from '@/lib/utils';

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: '1d', label: '오늘' },
  { value: '7d', label: '7일' },
  { value: '30d', label: '30일' },
  { value: '90d', label: '90일' },
  { value: 'custom', label: '기간 지정' },
];

type TabId = 'categories' | 'subCategories' | 'tools' | 'latest';

function formatRangeLabel(from: string, to: string) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const fmt = (date: Date) =>
    date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  return `${fmt(fromDate)} ~ ${fmt(toDate)}`;
}

export function ReviewAnalyticsDashboard() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('1d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('latest');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<AdminReviewAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewListFilter | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ period });
    if (period === 'custom') {
      if (!customFrom) {
        setError('시작일을 선택해 주세요.');
        setLoading(false);
        return;
      }
      params.set('from', new Date(`${customFrom}T00:00:00`).toISOString());
      if (customTo) {
        params.set('to', new Date(`${customTo}T23:59:59`).toISOString());
      }
    }

    try {
      const response = await fetch(`/api/admin/review-analytics?${params}`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof json.error === 'string' ? json.error : '통계 조회 실패',
        );
      }
      setData(json as AdminReviewAnalyticsData);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error ? fetchError.message : '통계 조회 실패',
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period, customFrom, customTo]);

  useEffect(() => {
    if (period !== 'custom') {
      void fetchAnalytics();
      return;
    }
    if (customFrom) {
      void fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [period, customFrom, customTo, fetchAnalytics]);

  const query = search.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    if (!data) return [];
    if (!query) return data.categories;
    return data.categories.filter(
      (row) =>
        row.category_name.toLowerCase().includes(query) ||
        row.category_slug.toLowerCase().includes(query),
    );
  }, [data, query]);

  const filteredSubCategories = useMemo(() => {
    if (!data) return [];
    if (!query) return data.subCategories;
    return data.subCategories.filter(
      (row) =>
        row.sub_category_name.toLowerCase().includes(query) ||
        row.sub_category_slug.toLowerCase().includes(query) ||
        row.category_name.toLowerCase().includes(query),
    );
  }, [data, query]);

  const filteredTools = useMemo(() => {
    if (!data) return [];
    if (!query) return data.tools;
    return data.tools.filter(
      (row) =>
        row.tool_name.toLowerCase().includes(query) ||
        row.tool_slug.toLowerCase().includes(query) ||
        row.category_name.toLowerCase().includes(query) ||
        (row.sub_category_name?.toLowerCase().includes(query) ?? false),
    );
  }, [data, query]);

  const openReviews = (filter: ReviewListFilter) => {
    setReviewFilter(filter);
    setReviewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-5 py-4 text-sm text-amber-900">
        <p className="font-medium">집계 기준</p>
        <p className="mt-1 text-amber-800/80">
          선택한 기간에 작성된 리뷰 수를 집계합니다. 행을 클릭하면 해당 범위의
          모든 리뷰를 볼 수 있습니다.
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">조회 기간</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    period === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {period === 'custom' && (
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm text-gray-600">
                시작일
                <input
                  type="date"
                  value={customFrom}
                  onChange={(event) => setCustomFrom(event.target.value)}
                  className="mt-1 block rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </label>
              <label className="text-sm text-gray-600">
                종료일
                <input
                  type="date"
                  value={customTo}
                  onChange={(event) => setCustomTo(event.target.value)}
                  className="mt-1 block rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </label>
              <button
                type="button"
                onClick={() => void fetchAnalytics()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                조회
              </button>
            </div>
          )}
        </div>

        {data && (
          <p className="mt-4 text-xs text-gray-500">
            {formatRangeLabel(data.summary.range.from, data.summary.range.to)}
          </p>
        )}
      </section>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          통계를 불러오는 중…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-8 text-center text-sm text-red-700">
          {error}
        </div>
      ) : data ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
              <p className="text-sm font-medium text-gray-500">기간 리뷰 수</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900">
                {data.summary.total.toLocaleString('ko-KR')}
              </p>
            </div>
            {[5, 4, 3, 2, 1].map((rating) => (
              <div
                key={rating}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-1 text-sm font-medium text-gray-500">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {rating}점
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900">
                  {(data.summary.byRating[rating] ?? 0).toLocaleString('ko-KR')}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['latest', '최신 리뷰'],
                    ['categories', '카테고리'],
                    ['subCategories', '서브카테고리'],
                    ['tools', '서비스'],
                  ] as const
                ).map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                      activeTab === tab
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="relative max-w-xs flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={
                    activeTab === 'latest'
                      ? '닉네임·서비스·내용 검색'
                      : '이름·슬러그 검색'
                  }
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {activeTab === 'latest' && data && (
                <ReviewLatestTable
                  from={data.summary.range.from}
                  to={data.summary.range.to}
                  search={search}
                />
              )}

              {activeTab === 'categories' && (
                <table className={cn(ADMIN_DASHBOARD_TABLE_CLASS, 'min-w-[640px]')}>
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500">
                      <th className="px-5 py-3 font-medium">카테고리</th>
                      <th className="px-5 py-3 font-medium">리뷰 수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((row) => (
                      <tr
                        key={row.category_slug}
                        className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50"
                        onClick={() =>
                          openReviews({
                            categorySlug: row.category_slug,
                            title: `${row.category_name} 리뷰`,
                          })
                        }
                      >
                        <td className="px-5 py-3 font-medium text-gray-900">
                          {row.category_name}
                          <span className="ml-2 font-mono text-xs text-gray-400">
                            {row.category_slug}
                          </span>
                        </td>
                        <td className="px-5 py-3 tabular-nums text-gray-900">
                          {row.review_count.toLocaleString('ko-KR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'subCategories' && (
                <table className={cn(ADMIN_DASHBOARD_TABLE_CLASS, 'min-w-[720px]')}>
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500">
                      <th className="px-5 py-3 font-medium">서브카테고리</th>
                      <th className="px-5 py-3 font-medium">카테고리</th>
                      <th className="px-5 py-3 font-medium">리뷰 수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubCategories.map((row) => (
                      <tr
                        key={row.sub_category_slug}
                        className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50"
                        onClick={() =>
                          openReviews({
                            subCategorySlug: row.sub_category_slug,
                            title: `${row.sub_category_name} 리뷰`,
                          })
                        }
                      >
                        <td className="px-5 py-3 font-medium text-gray-900">
                          {row.sub_category_name}
                        </td>
                        <td className="px-5 py-3 text-gray-600">{row.category_name}</td>
                        <td className="px-5 py-3 tabular-nums text-gray-900">
                          {row.review_count.toLocaleString('ko-KR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'tools' && (
                <table className={cn(ADMIN_DASHBOARD_TABLE_CLASS, 'min-w-[900px]')}>
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500">
                      <th className="px-5 py-3 font-medium">서비스</th>
                      <th className="px-5 py-3 font-medium">카테고리 - 서브카테고리</th>
                      <th className="px-5 py-3 font-medium">리뷰 수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTools.map((row) => (
                      <tr
                        key={row.tool_id}
                        className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50"
                        onClick={() =>
                          openReviews({
                            toolId: row.tool_id,
                            title: `${row.tool_name} 리뷰`,
                          })
                        }
                      >
                        <td className="px-5 py-3 font-medium text-gray-900">
                          {row.tool_name}
                          <div className="mt-0.5 font-mono text-xs text-gray-400">
                            {row.tool_slug}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {row.sub_category_name
                            ? `${row.category_name} - ${row.sub_category_name}`
                            : row.category_name}
                        </td>
                        <td className="px-5 py-3 tabular-nums text-gray-900">
                          {row.review_count.toLocaleString('ko-KR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-gray-500">
          <BarChart3 className="h-10 w-10 text-gray-300" />
          <p className="text-sm">기간을 선택하면 통계가 표시됩니다.</p>
        </div>
      )}

      <ReviewListModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        filter={reviewFilter}
        admin
      />
    </div>
  );
}
