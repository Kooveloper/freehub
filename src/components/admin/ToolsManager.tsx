'use client';

import { Download, MessageSquare, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ViewStatsCell } from '@/components/admin/ViewStatsCell';
import { Toast, useToast } from '@/components/admin/Toast';
import {
  ReviewListModal,
  type ReviewListFilter,
} from '@/components/admin/ReviewListModal';
import type { ToolExcelImportResult } from '@/lib/admin/tool-excel';
import {
  buildAdminToolsListUrl,
  consumeAdminToolToast,
} from '@/lib/admin/tool-toast';
import { Badge } from '@/components/ui/Badge';
import { ToolLogo } from '@/components/ui/ToolLogo';
import { toolInSubCategory, toolMatchesAdminFilters } from '@/lib/tool-categories';
import type { AdminCategory, AdminSubCategory } from '@/lib/supabase/admin-queries';
import { cn, formatFreeLimit } from '@/lib/utils';
import type { Tool } from '@/types/tool';

interface ToolsManagerProps {
  tools: Tool[];
  categories: AdminCategory[];
  subCategories: AdminSubCategory[];
  periodViewsByTool?: Record<string, number>;
}

async function parseApiError(response: Response) {
  const data = await response.json().catch(() => ({}));
  throw new Error(
    typeof data.error === 'string' ? data.error : '요청에 실패했습니다.',
  );
}

function formatUpdatedAt(date: string) {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function ToolsManager({
  tools,
  categories,
  subCategories,
  periodViewsByTool = {},
}: ToolsManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast, showToast, hideToast } = useToast();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ToolExcelImportResult | null>(
    null,
  );
  const [importError, setImportError] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewListFilter | null>(null);

  useEffect(() => {
    setSearch(searchParams.get('q') ?? '');
    setCategoryFilter(searchParams.get('category') ?? '');
    setSubCategoryFilter(searchParams.get('sub') ?? '');
  }, [searchParams]);

  useEffect(() => {
    const queued = consumeAdminToolToast();
    if (queued) {
      showToast(queued.message, queued.type);
    }
  }, [showToast]);

  const listReturnUrl = useMemo(
    () =>
      buildAdminToolsListUrl({
        q: search,
        category: categoryFilter,
        sub: subCategoryFilter,
      }),
    [search, categoryFilter, subCategoryFilter],
  );

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.slug, category.name])),
    [categories],
  );

  const subCategoryMap = useMemo(
    () => new Map(subCategories.map((sub) => [sub.slug, sub.name])),
    [subCategories],
  );

  const subCategoryOptions = useMemo(() => {
    if (!categoryFilter) return [];
    return subCategories.filter(
      (sub) => sub.category_slug === categoryFilter,
    );
  }, [subCategories, categoryFilter]);

  const filteredTools = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tools.filter((tool) => {
      const matchesSearch =
        !query ||
        tool.name.toLowerCase().includes(query) ||
        tool.slug.toLowerCase().includes(query);
      const matchesCategory = toolMatchesAdminFilters(
        tool,
        categoryFilter || undefined,
        subCategoryFilter || undefined,
      );

      return matchesSearch && matchesCategory;
    });
  }, [tools, search, categoryFilter, subCategoryFilter]);

  const handleImport = async (file: File) => {
    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/tools/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof data.error === 'string' ? data.error : '업로드에 실패했습니다.',
        );
      }

      setImportResult(data as ToolExcelImportResult);
      router.refresh();
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : '업로드에 실패했습니다.',
      );
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (tool: Tool) => {
    if (!window.confirm(`"${tool.name}" 서비스를 삭제하시겠습니까?`)) {
      return;
    }

    setPendingId(tool.id);
    try {
      const response = await fetch(`/api/admin/tools/${tool.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) await parseApiError(response);
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : '삭제에 실패했습니다.',
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="서비스명 또는 슬러그 검색"
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setSubCategoryFilter('');
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">전체 카테고리</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={subCategoryFilter}
            onChange={(event) => setSubCategoryFilter(event.target.value)}
            disabled={!categoryFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">
              {categoryFilter ? '전체 서브카테고리' : '카테고리 선택'}
            </option>
            {subCategoryOptions.map((sub) => (
              <option key={sub.id} value={sub.slug}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/admin/tools/export"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            양식 다운로드
          </a>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImport(file);
            }}
          />
          <button
            type="button"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {importing ? '업로드 중…' : '엑셀 업로드'}
          </button>

          <Link
            href="/admin/tools/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            서비스 추가
          </Link>
        </div>
      </div>

      {(importResult || importError) && (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-sm',
            importError
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-green-200 bg-green-50 text-green-900',
          )}
        >
          {importError ? (
            <p>{importError}</p>
          ) : importResult ? (
            <div className="space-y-2">
              <p>
                업로드 완료 — 신규 {importResult.created}건, 수정{' '}
                {importResult.updated}건
                {importResult.failed.length > 0
                  ? `, 실패 ${importResult.failed.length}건`
                  : ''}
              </p>
              {importResult.failed.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-xs">
                  {importResult.failed.map((failure) => (
                    <li key={`${failure.row}-${failure.slug}`}>
                      {failure.row}행 ({failure.slug}): {failure.error}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">로고</th>
                <th className="px-4 py-3 font-medium">서비스명</th>
                <th className="px-4 py-3 font-medium">카테고리 / 서브</th>
                <th className="px-4 py-3 font-medium">무료 한도</th>
                <th className="px-4 py-3 font-medium">조회수 (누적 / 30일)</th>
                <th className="px-4 py-3 font-medium">검증</th>
                <th className="px-4 py-3 font-medium">수정일</th>
                <th className="px-4 py-3 font-medium">액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredTools.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    {tools.length === 0
                      ? '등록된 서비스가 없습니다.'
                      : '검색 결과가 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredTools.map((tool) => {
                  const isPending = pendingId === tool.id;
                  const freeLimitLabel = tool.free_plan_exists
                    ? formatFreeLimit(
                        tool.free_limit_type,
                        tool.free_limit_amount,
                        tool.free_limit_unit,
                      )
                    : '무료 플랜 없음';

                  return (
                    <tr
                      key={tool.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <ToolLogo name={tool.name} logoUrl={tool.logo_url} size={40} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {tool.name}
                        </div>
                        <div className="mt-0.5 font-mono text-xs text-gray-500">
                          {tool.slug}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div className="space-y-1">
                          {(tool.category_assignments ?? []).length > 0 ? (
                            tool.category_assignments!.map((assignment) => (
                              <div
                                key={`${assignment.category_slug}-${assignment.sub_category ?? 'none'}`}
                              >
                                <div>
                                  {categoryMap.get(assignment.category_slug) ??
                                    assignment.category_slug}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {assignment.sub_category
                                    ? subCategoryMap.get(assignment.sub_category) ??
                                      assignment.sub_category
                                    : '—'}
                                </div>
                              </div>
                            ))
                          ) : (
                            <>
                              <div>
                                {categoryMap.get(tool.category_slug) ??
                                  tool.category_slug}
                              </div>
                              <div className="text-xs text-gray-500">
                                {tool.sub_category
                                  ? subCategoryMap.get(tool.sub_category) ??
                                    tool.sub_category
                                  : '—'}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {freeLimitLabel}
                      </td>
                      <td className="px-4 py-3">
                        <ViewStatsCell
                          lifetime={tool.view_count}
                          period={periodViewsByTool[tool.id] ?? 0}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={tool.is_verified ? 'green' : 'gray'}>
                          {tool.is_verified ? '검증됨' : '미검증'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatUpdatedAt(tool.updated_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setReviewFilter({
                                toolId: tool.id,
                                title: `${tool.name} 리뷰`,
                              });
                              setReviewModalOpen(true);
                            }}
                            className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-amber-600"
                            aria-label="리뷰 보기"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/admin/tools/${tool.id}?return=${encodeURIComponent(listReturnUrl)}`}
                            className={cn(
                              'rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600',
                              isPending && 'pointer-events-none opacity-50',
                            )}
                            aria-label="수정"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleDelete(tool)}
                            className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600 disabled:opacity-50"
                            aria-label="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Toast toast={toast} onClose={hideToast} />

      <ReviewListModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        filter={reviewFilter}
        admin
      />
    </div>
  );
}
