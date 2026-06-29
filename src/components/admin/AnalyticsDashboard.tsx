'use client';

import { BarChart3, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  resolveClickMetricDisplay,
  type AdminAnalyticsData,
  type AnalyticsPeriod,
  type CategoryViewStat,
  type ClickMetricFilter,
  type SubCategoryViewStat,
  type ToolViewStat,
} from '@/lib/admin/analytics';
import { ADMIN_DASHBOARD_TABLE_CLASS } from '@/components/admin/admin-table';
import { cn } from '@/lib/utils';

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: '1d', label: '오늘' },
  { value: '7d', label: '7일' },
  { value: '30d', label: '30일' },
  { value: '90d', label: '90일' },
  { value: 'custom', label: '기간 지정' },
];

const CLICK_METRIC_OPTIONS: { value: ClickMetricFilter; label: string }[] = [
  { value: 'total', label: '클릭 총합' },
  { value: 'official_site', label: '공식 사이트' },
  { value: 'cta_start_free', label: '무료로 시작하기' },
];

type TabId = 'categories' | 'subCategories' | 'tools';

type ClickMetricRow = Pick<
  CategoryViewStat | SubCategoryViewStat | ToolViewStat,
  'view_count' | 'click_count' | 'click_breakdown' | 'ctr'
>;

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

function formatCtr(value: number) {
  return `${value.toLocaleString('ko-KR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function ClickMetricCells({
  row,
  filter,
}: {
  row: ClickMetricRow;
  filter: ClickMetricFilter;
}) {
  const metrics = resolveClickMetricDisplay(
    row.view_count,
    row.click_count,
    row.click_breakdown,
    row.ctr,
    filter,
  );

  return (
    <>
      <td className="px-5 py-3 tabular-nums text-gray-900">
        {metrics.clicks.toLocaleString('ko-KR')}
      </td>
      <td className="px-5 py-3 tabular-nums text-gray-700">
        {formatCtr(metrics.ctr)}
      </td>
    </>
  );
}

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('1d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('categories');
  const [search, setSearch] = useState('');
  const [clickMetric, setClickMetric] = useState<ClickMetricFilter>('total');
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const response = await fetch(`/api/admin/analytics?${params}`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof json.error === 'string' ? json.error : '통계 조회 실패',
        );
      }
      setData(json as AdminAnalyticsData);
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

  const clickMetricLabel =
    CLICK_METRIC_OPTIONS.find((option) => option.value === clickMetric)?.label ??
    '클릭 총합';

  const summaryClickMetrics = useMemo(() => {
    if (!data) return null;
    return resolveClickMetricDisplay(
      data.summary.totalViews,
      data.summary.totalClicks,
      data.summary.click_breakdown,
      data.summary.ctr,
      clickMetric,
    );
  }, [data, clickMetric]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-5 py-4 text-sm text-blue-900">
        <p className="font-medium">집계 기준</p>
        <p className="mt-1 text-blue-800/80">
          공개 서비스 상세 페이지(/tool/슬러그) 방문만 집계합니다. IP당 24시간 1회 ·
          홈·카테고리 탭 선택은 포함되지 않습니다. 기간 클릭수는 상세 페이지의 공식
          사이트 링크·「지금 무료로 시작하기」 클릭 합계이며, CTR은 기간 클릭수 ÷
          기간 조회수입니다. 누적 조회수는 서비스 테이블 기준, 기간 조회수·클릭수는
          이벤트 로그 기준입니다.
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
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">기간 조회수</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900">
                {data.summary.totalViews.toLocaleString('ko-KR')}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                기간 클릭수 ({clickMetricLabel})
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900">
                {(summaryClickMetrics?.clicks ?? 0).toLocaleString('ko-KR')}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                CTR ({clickMetricLabel})
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900">
                {formatCtr(summaryClickMetrics?.ctr ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                조회된 서비스 수 (기간 내)
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900">
                {data.summary.uniqueTools.toLocaleString('ko-KR')}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {(
                  [
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

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="text-sm text-gray-600">
                  <span className="mb-1 block font-medium">클릭 집계</span>
                  <select
                    value={clickMetric}
                    onChange={(event) =>
                      setClickMetric(event.target.value as ClickMetricFilter)
                    }
                    className="w-full min-w-[10rem] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-auto"
                  >
                    {CLICK_METRIC_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="relative max-w-xs flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="이름·슬러그 검색"
                    className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {activeTab === 'categories' && (
                <table className={cn(ADMIN_DASHBOARD_TABLE_CLASS, 'min-w-[840px]')}>
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500">
                      <th className="px-5 py-3 font-medium">카테고리</th>
                      <th className="px-5 py-3 font-medium">기간 조회수</th>
                      <th className="px-5 py-3 font-medium">
                        기간 클릭수 ({clickMetricLabel})
                      </th>
                      <th className="px-5 py-3 font-medium">
                        CTR ({clickMetricLabel})
                      </th>
                      <th className="px-5 py-3 font-medium">누적 조회수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-10 text-center text-gray-400"
                        >
                          데이터가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((row) => (
                        <tr
                          key={row.category_slug}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="px-5 py-3 font-medium text-gray-900">
                            {row.category_name}
                            <span className="ml-2 font-mono text-xs text-gray-400">
                              {row.category_slug}
                            </span>
                          </td>
                          <td className="px-5 py-3 tabular-nums text-gray-900">
                            {row.view_count.toLocaleString('ko-KR')}
                          </td>
                          <ClickMetricCells row={row} filter={clickMetric} />
                          <td className="px-5 py-3 tabular-nums text-gray-500">
                            {row.lifetime_view_count.toLocaleString('ko-KR')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === 'subCategories' && (
                <table className={cn(ADMIN_DASHBOARD_TABLE_CLASS, 'min-w-[960px]')}>
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500">
                      <th className="px-5 py-3 font-medium">서브카테고리</th>
                      <th className="px-5 py-3 font-medium">카테고리</th>
                      <th className="px-5 py-3 font-medium">기간 조회수</th>
                      <th className="px-5 py-3 font-medium">
                        기간 클릭수 ({clickMetricLabel})
                      </th>
                      <th className="px-5 py-3 font-medium">
                        CTR ({clickMetricLabel})
                      </th>
                      <th className="px-5 py-3 font-medium">누적 조회수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubCategories.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-10 text-center text-gray-400"
                        >
                          데이터가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredSubCategories.map((row) => (
                        <tr
                          key={row.sub_category_slug}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="px-5 py-3 font-medium text-gray-900">
                            {row.sub_category_name}
                            <span className="ml-2 font-mono text-xs text-gray-400">
                              {row.sub_category_slug}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-600">
                            {row.category_name}
                          </td>
                          <td className="px-5 py-3 tabular-nums text-gray-900">
                            {row.view_count.toLocaleString('ko-KR')}
                          </td>
                          <ClickMetricCells row={row} filter={clickMetric} />
                          <td className="px-5 py-3 tabular-nums text-gray-500">
                            {row.lifetime_view_count.toLocaleString('ko-KR')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === 'tools' && (
                <table className={cn(ADMIN_DASHBOARD_TABLE_CLASS, 'min-w-[1080px]')}>
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500">
                      <th className="px-5 py-3 font-medium">서비스</th>
                      <th className="px-5 py-3 font-medium">카테고리 - 서브카테고리</th>
                      <th className="px-5 py-3 font-medium">기간 조회수</th>
                      <th className="px-5 py-3 font-medium">
                        기간 클릭수 ({clickMetricLabel})
                      </th>
                      <th className="px-5 py-3 font-medium">
                        CTR ({clickMetricLabel})
                      </th>
                      <th className="px-5 py-3 font-medium">누적 조회수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTools.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-10 text-center text-gray-400"
                        >
                          데이터가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredTools.map((row) => (
                        <tr
                          key={row.tool_id}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="px-5 py-3">
                            <Link
                              href={`/admin/tools/${row.tool_id}`}
                              className="font-medium text-gray-900 hover:text-blue-600"
                            >
                              {row.tool_name}
                            </Link>
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
                            {row.view_count.toLocaleString('ko-KR')}
                          </td>
                          <ClickMetricCells row={row} filter={clickMetric} />
                          <td className="px-5 py-3 tabular-nums text-gray-500">
                            {row.lifetime_view_count.toLocaleString('ko-KR')}
                          </td>
                        </tr>
                      ))
                    )}
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
    </div>
  );
}
