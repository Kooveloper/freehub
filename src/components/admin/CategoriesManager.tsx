'use client';

import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Fragment, useMemo, useState } from 'react';

import {
  CategoryModal,
  type CategoryFormValues,
} from '@/components/admin/CategoryModal';
import { ViewStatsCell } from '@/components/admin/ViewStatsCell';
import {
  SubCategoryModal,
  type SubCategoryFormValues,
} from '@/components/admin/SubCategoryModal';
import { CategoryIcon } from '@/components/category/CategoryIcon';
import { Badge } from '@/components/ui/Badge';
import { getCategoryColorHex } from '@/constants/category-colors';
import type { AdminCategory, AdminSubCategory } from '@/lib/supabase/admin-queries';
import { cn } from '@/lib/utils';

interface CategoriesManagerProps {
  categories: AdminCategory[];
  subCategories: AdminSubCategory[];
  periodViewsByCategory?: Record<string, number>;
  periodViewsBySubCategory?: Record<string, number>;
}

async function parseApiError(response: Response) {
  const data = await response.json().catch(() => ({}));
  throw new Error(
    typeof data.error === 'string' ? data.error : '요청에 실패했습니다.',
  );
}

export function CategoriesManager({
  categories,
  subCategories,
  periodViewsByCategory = {},
  periodViewsBySubCategory = {},
}: CategoriesManagerProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(
    null,
  );
  const [editingSubCategory, setEditingSubCategory] =
    useState<AdminSubCategory | null>(null);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(
    null,
  );
  const [pendingId, setPendingId] = useState<string | null>(null);

  const nextSortOrder = useMemo(() => {
    if (categories.length === 0) return 1;
    return Math.max(...categories.map((category) => category.sort_order)) + 1;
  }, [categories]);

  const subByCategory = useMemo(() => {
    const map: Record<string, AdminSubCategory[]> = {};
    for (const sub of subCategories) {
      if (!map[sub.category_slug]) {
        map[sub.category_slug] = [];
      }
      map[sub.category_slug].push(sub);
    }
    for (const slug of Object.keys(map)) {
      map[slug].sort((a, b) => a.sort_order - b.sort_order);
    }
    return map;
  }, [subCategories]);

  const refresh = () => router.refresh();

  const openCreateModal = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const openEditModal = (category: AdminCategory) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const openCreateSubModal = (categorySlug: string) => {
    setActiveCategorySlug(categorySlug);
    setEditingSubCategory(null);
    setSubModalOpen(true);
  };

  const openEditSubModal = (
    categorySlug: string,
    subCategory: AdminSubCategory,
  ) => {
    setActiveCategorySlug(categorySlug);
    setEditingSubCategory(subCategory);
    setSubModalOpen(true);
  };

  const nextSubSortOrder = (categorySlug: string) => {
    const subs = subByCategory[categorySlug] ?? [];
    if (subs.length === 0) return 1;
    return Math.max(...subs.map((sub) => sub.sort_order)) + 1;
  };

  const toggleExpanded = (categorySlug: string) => {
    setActiveCategorySlug((prev) =>
      prev === categorySlug ? null : categorySlug,
    );
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

  const handleSubSubmit = async (values: SubCategoryFormValues) => {
    if (!activeCategorySlug) return;

    if (editingSubCategory) {
      const response = await fetch(
        `/api/admin/sub-categories/${editingSubCategory.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: values.name,
            name_en: values.name_en,
            sort_order: values.sort_order,
            is_active: values.is_active,
          }),
        },
      );

      if (!response.ok) await parseApiError(response);
    } else {
      const response = await fetch('/api/admin/sub-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: values.slug,
          name: values.name,
          name_en: values.name_en,
          category_slug: activeCategorySlug,
          sort_order: values.sort_order,
          is_active: values.is_active,
        }),
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

  const handleDeleteSub = async (subCategory: AdminSubCategory) => {
    if (
      !window.confirm(`"${subCategory.name}" 서브카테고리를 삭제하시겠습니까?`)
    ) {
      return;
    }

    setPendingId(subCategory.id);
    try {
      const response = await fetch(
        `/api/admin/sub-categories/${subCategory.id}`,
        { method: 'DELETE' },
      );

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
                <th className="px-4 py-3 font-medium" />
                <th className="px-4 py-3 font-medium">아이콘</th>
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">슬러그</th>
                <th className="px-4 py-3 font-medium">툴 수</th>
                <th className="px-4 py-3 font-medium">조회수 (누적 / 30일)</th>
                <th className="px-4 py-3 font-medium">활성화</th>
                <th className="px-4 py-3 font-medium">순서</th>
                <th className="px-4 py-3 font-medium">액션</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    등록된 카테고리가 없습니다.
                  </td>
                </tr>
              ) : (
                categories.map((category, index) => {
                  const isPending = pendingId === category.id;
                  const colorHex = getCategoryColorHex(category.color);
                  const isExpanded = activeCategorySlug === category.slug;
                  const categorySubs = subByCategory[category.slug] ?? [];

                  return (
                    <Fragment key={category.id}>
                      <tr
                        key={category.id}
                        className={cn(
                          'border-b border-gray-100',
                          isExpanded && 'bg-gray-50/80',
                        )}
                      >
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            onClick={() => toggleExpanded(category.slug)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            aria-label={
                              isExpanded ? '서브카테고리 접기' : '서브카테고리 펼치기'
                            }
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleExpanded(category.slug)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
                            style={{
                              backgroundColor: `${colorHex}18`,
                            }}
                          >
                            <CategoryIcon name={category.icon} size={22} />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleExpanded(category.slug)}
                            className="text-left"
                          >
                            <div className="font-medium text-gray-900">
                              {category.name}
                            </div>
                            <div className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                              {category.description}
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">
                          {category.slug}
                        </td>
                      <td className="px-4 py-3 text-gray-700">
                        {category.tool_count.toLocaleString('ko-KR')}
                      </td>
                      <td className="px-4 py-3">
                        <ViewStatsCell
                          lifetime={category.view_count_sum}
                          period={periodViewsByCategory[category.slug] ?? 0}
                        />
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
                              onClick={() =>
                                handleMove(category.id, 'move_down')
                              }
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
                      {isExpanded && (
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="ml-8 rounded-lg border border-gray-200 bg-white">
                              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                                <h3 className="text-sm font-semibold text-gray-900">
                                  서브카테고리 ({categorySubs.length})
                                </h3>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openCreateSubModal(category.slug)
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  추가
                                </button>
                              </div>
                              {categorySubs.length === 0 ? (
                                <p className="px-4 py-6 text-center text-sm text-gray-400">
                                  등록된 서브카테고리가 없습니다.
                                </p>
                              ) : (
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                                      <th className="px-4 py-2 font-medium">이름</th>
                                      <th className="px-4 py-2 font-medium">슬러그</th>
                                      <th className="px-4 py-2 font-medium">툴 수</th>
                                      <th className="px-4 py-2 font-medium">
                                        조회수 (누적 / 30일)
                                      </th>
                                      <th className="px-4 py-2 font-medium">순서</th>
                                      <th className="px-4 py-2 font-medium">상태</th>
                                      <th className="px-4 py-2 font-medium">액션</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {categorySubs.map((sub) => {
                                      const subPending = pendingId === sub.id;
                                      return (
                                        <tr
                                          key={sub.id}
                                          className="border-b border-gray-50 last:border-0"
                                        >
                                          <td className="px-4 py-2 font-medium text-gray-900">
                                            {sub.name}
                                          </td>
                                          <td className="px-4 py-2 font-mono text-xs text-gray-600">
                                            {sub.slug}
                                          </td>
                                          <td className="px-4 py-2 text-gray-700">
                                            {sub.tool_count.toLocaleString('ko-KR')}
                                          </td>
                                          <td className="px-4 py-2">
                                            <ViewStatsCell
                                              lifetime={sub.view_count_sum}
                                              period={
                                                periodViewsBySubCategory[sub.slug] ??
                                                0
                                              }
                                            />
                                          </td>
                                          <td className="px-4 py-2 text-gray-700">
                                            {sub.sort_order}
                                          </td>
                                          <td className="px-4 py-2">
                                            <Badge
                                              variant={
                                                sub.is_active ? 'green' : 'gray'
                                              }
                                            >
                                              {sub.is_active ? '활성' : '비활성'}
                                            </Badge>
                                          </td>
                                          <td className="px-4 py-2">
                                            <div className="flex items-center gap-1">
                                              <button
                                                type="button"
                                                disabled={subPending}
                                                onClick={() =>
                                                  openEditSubModal(
                                                    category.slug,
                                                    sub,
                                                  )
                                                }
                                                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 disabled:opacity-50"
                                                aria-label="서브카테고리 수정"
                                              >
                                                <Pencil className="h-3.5 w-3.5" />
                                              </button>
                                              <button
                                                type="button"
                                                disabled={subPending}
                                                onClick={() =>
                                                  handleDeleteSub(sub)
                                                }
                                                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 disabled:opacity-50"
                                                aria-label="서브카테고리 삭제"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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

      {activeCategorySlug && (
        <SubCategoryModal
          open={subModalOpen}
          onOpenChange={setSubModalOpen}
          categorySlug={activeCategorySlug}
          subCategory={editingSubCategory}
          nextSortOrder={nextSubSortOrder(activeCategorySlug)}
          onSubmit={handleSubSubmit}
        />
      )}
    </>
  );
}
