'use client';

import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Toast, useToast } from '@/components/admin/Toast';
import { ToolLogo } from '@/components/ui/ToolLogo';
import type { Category, Tool } from '@/types/tool';

interface FeaturedRow {
  tool_id: string;
  sort_order: number;
  tool?: Pick<Tool, 'id' | 'name' | 'slug' | 'logo_url' | 'view_count'>;
}

interface FeaturedToolsManagerProps {
  periodViewsByTool?: Record<string, number>;
}

function formatViewLabel(
  toolId: string,
  lifetime: number,
  periodViewsByTool: Record<string, number>,
) {
  const period = periodViewsByTool[toolId] ?? 0;
  return `누적 ${lifetime.toLocaleString()} · 30일 ${period.toLocaleString()}`;
}

export function FeaturedToolsManager({
  periodViewsByTool = {},
}: FeaturedToolsManagerProps) {
  const { toast, showToast, hideToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [featured, setFeatured] = useState<FeaturedRow[]>([]);
  const [categoryTools, setCategoryTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((res) => res.json())
      .then((data) => {
        const list = (data.categories ?? []) as Category[];
        setCategories(list);
        if (list[0]) setSelectedSlug(list[0].slug);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSlug) return;

    Promise.all([
      fetch(`/api/admin/featured/${selectedSlug}`).then((res) => res.json()),
      fetch(`/api/categories/${selectedSlug}/tools`).then((res) => res.json()),
    ]).then(([featuredData, toolsData]) => {
      setFeatured(featuredData.featured ?? []);
      setCategoryTools(toolsData.tools ?? []);
    });
  }, [selectedSlug]);

  const addTool = (tool: Tool) => {
    if (featured.length >= 5) {
      showToast('최대 5개까지 설정할 수 있습니다.', 'error');
      return;
    }
    if (featured.some((row) => row.tool_id === tool.id)) return;
    setFeatured((prev) => [
      ...prev,
      {
        tool_id: tool.id,
        sort_order: prev.length,
        tool: {
          id: tool.id,
          name: tool.name,
          slug: tool.slug,
          logo_url: tool.logo_url,
          view_count: tool.view_count,
        },
      },
    ]);
  };

  const removeTool = (toolId: string) => {
    setFeatured((prev) =>
      prev
        .filter((row) => row.tool_id !== toolId)
        .map((row, index) => ({ ...row, sort_order: index })),
    );
  };

  const moveTool = (index: number, direction: 'up' | 'down') => {
    setFeatured((prev) => {
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((row, i) => ({ ...row, sort_order: i }));
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/featured/${selectedSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_ids: featured.map((row) => row.tool_id),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? '저장 실패');
      showToast('인기 서비스 순서가 저장되었습니다.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '저장 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  const availableTools = categoryTools.filter(
    (tool) => !featured.some((row) => row.tool_id === tool.id),
  );

  if (loading) {
    return <p className="text-sm text-gray-500">불러오는 중…</p>;
  }

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            카테고리
          </label>
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-gray-900">
            노출 순서 (Top 5)
          </h2>
          <p className="mb-4 text-xs text-gray-500">
            설정하지 않은 슬롯은 조회수 순으로 자동 채워집니다.
          </p>

          {featured.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              아래에서 서비스를 추가하세요.
            </p>
          ) : (
            <ul className="space-y-2">
              {featured.map((row, index) => {
                const tool =
                  row.tool ??
                  categoryTools.find((t) => t.id === row.tool_id);
                if (!tool) return null;

                return (
                  <li
                    key={row.tool_id}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <GripVertical className="h-4 w-4 shrink-0 text-gray-300" />
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <ToolLogo name={tool.name} logoUrl={tool.logo_url} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {tool.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatViewLabel(
                          tool.id,
                          tool.view_count ?? 0,
                          periodViewsByTool,
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => moveTool(index, 'up')}
                        disabled={index === 0}
                        className="rounded p-1 text-gray-400 hover:bg-white disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTool(index, 'down')}
                        disabled={index === featured.length - 1}
                        className="rounded p-1 text-gray-400 hover:bg-white disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTool(row.tool_id)}
                        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-white"
                      >
                        제거
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            서비스 추가
          </h2>
          <ul className="max-h-64 space-y-1 overflow-auto">
            {availableTools.map((tool) => (
              <li key={tool.id}>
                <button
                  type="button"
                  onClick={() => addTool(tool)}
                  disabled={featured.length >= 5}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-gray-50 disabled:opacity-50"
                >
                  <ToolLogo name={tool.name} logoUrl={tool.logo_url} size={28} />
                  <span className="truncate text-sm font-medium text-gray-800">
                    {tool.name}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">
                    {formatViewLabel(
                      tool.id,
                      tool.view_count,
                      periodViewsByTool,
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex justify-end pb-8">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
