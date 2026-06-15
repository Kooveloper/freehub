'use client';

import { Plus, Trash2 } from 'lucide-react';

import type { ToolCategoryAssignmentInput } from '@/lib/tool-categories';
import { cn } from '@/lib/utils';
import type { Category, SubCategory } from '@/types/tool';

interface CategoryAssignmentsEditorProps {
  assignments: ToolCategoryAssignmentInput[];
  categories: Category[];
  subCategories: SubCategory[];
  onChange: (assignments: ToolCategoryAssignmentInput[]) => void;
}

const SELECT_CLASS =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

export function CategoryAssignmentsEditor({
  assignments,
  categories,
  subCategories,
  onChange,
}: CategoryAssignmentsEditorProps) {
  const subsByCategory = subCategories.reduce<Record<string, SubCategory[]>>(
    (map, sub) => {
      if (!map[sub.category_slug]) map[sub.category_slug] = [];
      map[sub.category_slug].push(sub);
      return map;
    },
    {},
  );

  const updateRow = (
    index: number,
    patch: Partial<ToolCategoryAssignmentInput>,
  ) => {
    onChange(
      assignments.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  };

  const removeRow = (index: number) => {
    if (assignments.length <= 1) return;
    onChange(assignments.filter((_, rowIndex) => rowIndex !== index));
  };

  const addRow = () => {
    const defaultCategory = categories[0]?.slug ?? '';
    onChange([
      ...assignments,
      { category_slug: defaultCategory, sub_category: null },
    ]);
  };

  return (
    <div className="space-y-3">
      {assignments.map((row, index) => {
        const subs = subsByCategory[row.category_slug] ?? [];

        return (
          <div
            key={`${index}-${row.category_slug}-${row.sub_category ?? 'none'}`}
            className="rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {index === 0 ? '주 분류' : `추가 분류 ${index}`}
              </span>
              {assignments.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="rounded p-1.5 text-gray-400 hover:bg-white hover:text-red-600"
                  aria-label="분류 삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  대카테고리
                </label>
                <select
                  value={row.category_slug}
                  onChange={(event) =>
                    updateRow(index, {
                      category_slug: event.target.value,
                      sub_category: null,
                    })
                  }
                  className={SELECT_CLASS}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  서브카테고리
                </label>
                <select
                  value={row.sub_category ?? ''}
                  onChange={(event) =>
                    updateRow(index, {
                      sub_category: event.target.value || null,
                    })
                  }
                  disabled={subs.length === 0}
                  className={cn(SELECT_CLASS, 'disabled:bg-gray-100')}
                >
                  <option value="">
                    {subs.length === 0 ? '서브카테고리 없음' : '선택 안 함'}
                  </option>
                  {subs.map((sub) => (
                    <option key={sub.id} value={sub.slug}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50"
      >
        <Plus className="h-4 w-4" />
        카테고리/서브카테고리 추가
      </button>
    </div>
  );
}
