'use client';

import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  CategoryModal,
  type CategoryFormValues,
} from '@/components/admin/CategoryModal';
import { CategoryIcon } from '@/components/category/CategoryIcon';
import { Badge } from '@/components/ui/Badge';
import { getCategoryColorHex } from '@/constants/category-colors';
import type { AdminCategory } from '@/lib/supabase/admin-queries';
import { cn } from '@/lib/utils';

interface CategoriesManagerProps {
  categories: AdminCategory[];
}

async function parseApiError(response: Response) {
  const data = await response.json().catch(() => ({}));
  throw new Error(
    typeof data.error === 'string' ? data.error : '요청에 실패했습니다.',
  );
}

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(
    null,
  );
  const [pendingId, setPendingId] = useState<string | null>(null);

  const nextSortOrder = useMemo(() => {
    if (categories.length === 0) return 1;
    return Math.max(...categories.map((category) => category.sort_order)) + 1;
  }, [categories]);

  const refresh = () => router.refresh();

  const openCreateModal = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const openEditModal = (category: AdminCategory) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleSubmit = async (values: CategoryFormValues) => {
    if (editingCategory) {
      const response = await fetch(
        `/api/admin/categories/${editingCategory.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: values.name,
            name_en: values.name_en,
            description: values.description,
            description_en: values.description_en,
            icon: values.icon,
            color: values.color,
            sort_order: values.sort_order,
          }),
        },
      );

      if (!response.ok) await parseApiError(response);
    } else {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) await parseApiError(response);
    }

    refresh();
  };

  const handleMove = async (id: string, action: 'move_up' | 'move_down') => {
    setPendingId(id);
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) await parseApiError(response);
      refresh();
    } finally {
      setPendingId(null);
    }
  };

  const handleToggleActive = async (category: AdminCategory) => {
    setPendingId(category.id);
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !category.is_active }),
      });

      if (!response.ok) await parseApiError(response);
      refresh();
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (category: AdminCategory) => {
    if (category.tool_count > 0) {
      window.alert(
        `이 카테고리에 ${category.tool_count}개의 툴이 연결되어 있어 삭제할 수 없습니다.`,
      );
      return;
    }

    if (!window.confirm(`"${category.name}" 카테고리를 삭제하시겠습니까?`)) {
      return;
    }

    setPendingId(category.id);
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) await parseApiError(response);
      refresh();
    } finally {
      setPendingId(null);
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          카테고리 추가
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">아이콘</th>
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">슬러그</th>
                <th className="px-4 py-3 font-medium">툴 수</th>
                <th className="px-4 py-3 font-medium">활성화</th>
                <th className="px-4 py-3 font-medium">순서</th>
                <th className="px-4 py-3 font-medium">액션</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    등록된 카테고리가 없습니다.
                  </td>
                </tr>
              ) : (
                categories.map((category, index) => {
                  const isPending = pendingId === category.id;
                  const colorHex = getCategoryColorHex(category.color);

                  return (
                    <tr
                      key={category.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
                          style={{
                            backgroundColor: `${colorHex}18`,
                          }}
                        >
                          <CategoryIcon name={category.icon} size={22} />
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {category.name}
                        </div>
                        <div className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                          {category.description}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {category.slug}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {category.tool_count.toLocaleString('ko-KR')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleToggleActive(category)}
                          className="disabled:opacity-50"
                        >
                          <Badge
                            variant={category.is_active ? 'green' : 'gray'}
                          >
                            {category.is_active ? '활성' : '비활성'}
                          </Badge>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="w-6 text-center text-gray-700">
                            {category.sort_order}
                          </span>
                          <button
                            type="button"
                            disabled={isPending || index === 0}
                            onClick={() => handleMove(category.id, 'move_up')}
                            className={cn(
                              'rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700',
                              'disabled:cursor-not-allowed disabled:opacity-30',
                            )}
                            aria-label="위로 이동"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={
                              isPending || index === categories.length - 1
                            }
                            onClick={() => handleMove(category.id, 'move_down')}
                            className={cn(
                              'rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700',
                              'disabled:cursor-not-allowed disabled:opacity-30',
                            )}
                            aria-label="아래로 이동"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => openEditModal(category)}
                            className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 disabled:opacity-50"
                            aria-label="수정"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleDelete(category)}
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

      <CategoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        category={editingCategory}
        nextSortOrder={nextSortOrder}
        onSubmit={handleSubmit}
      />
    </>
  );
}
