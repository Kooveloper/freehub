'use client';

import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { ViewStatsCell } from '@/components/admin/ViewStatsCell';
import { Badge } from '@/components/ui/Badge';
import { ToolLogo } from '@/components/ui/ToolLogo';
import type { AdminCategory } from '@/lib/supabase/admin-queries';
import { cn, formatFreeLimit } from '@/lib/utils';
import type { Tool } from '@/types/tool';

interface ToolsManagerProps {
  tools: Tool[];
  categories: AdminCategory[];
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
  periodViewsByTool = {},
}: ToolsManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.slug, category.name])),
    [categories],
  );

  const filteredTools = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tools.filter((tool) => {
      const matchesSearch =
        !query ||
        tool.name.toLowerCase().includes(query) ||
        tool.slug.toLowerCase().includes(query);
      const matchesCategory =
        !categoryFilter || tool.category_slug === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [tools, search, categoryFilter]);

  const handleDelete = async (tool: Tool) => {
    if (!window.confirm(`"${tool.name}" 툴을 삭제하시겠습니까?`)) {
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
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">전체 카테고리</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <Link
          href="/admin/tools/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          툴 추가
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">로고</th>
                <th className="px-4 py-3 font-medium">서비스명</th>
                <th className="px-4 py-3 font-medium">카테고리</th>
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
                      ? '등록된 툴이 없습니다.'
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
                        {categoryMap.get(tool.category_slug) ??
                          tool.category_slug}
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
                          <Link
                            href={`/admin/tools/${tool.id}`}
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
    </div>
  );
}
