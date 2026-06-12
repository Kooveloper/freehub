'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { SLUG_PATTERN } from '@/lib/admin/categories';
import { cn } from '@/lib/utils';
import type { AdminSubCategory } from '@/lib/supabase/admin-queries';

export interface SubCategoryFormValues {
  slug: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

interface SubCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categorySlug: string;
  subCategory?: AdminSubCategory | null;
  nextSortOrder: number;
  onSubmit: (values: SubCategoryFormValues) => Promise<void>;
}

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-gray-700';

function buildInitialValues(
  subCategory: AdminSubCategory | null | undefined,
  nextSortOrder: number,
): SubCategoryFormValues {
  if (subCategory) {
    return {
      slug: subCategory.slug,
      name: subCategory.name,
      sort_order: subCategory.sort_order,
      is_active: subCategory.is_active,
    };
  }

  return {
    slug: '',
    name: '',
    sort_order: nextSortOrder,
    is_active: true,
  };
}

export function SubCategoryModal({
  open,
  onOpenChange,
  categorySlug,
  subCategory,
  nextSortOrder,
  onSubmit,
}: SubCategoryModalProps) {
  const isEdit = Boolean(subCategory);
  const [values, setValues] = useState<SubCategoryFormValues>(() =>
    buildInitialValues(subCategory, nextSortOrder),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setValues(buildInitialValues(subCategory, nextSortOrder));
      setError('');
    }
  }, [open, subCategory, nextSortOrder]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!isEdit && (!values.slug.trim() || !SLUG_PATTERN.test(values.slug))) {
      setError('슬러그 형식을 확인해주세요. (예: image-bg-remove)');
      return;
    }
    if (!values.name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : '저장에 실패했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="닫기"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? '서브카테고리 수정' : '서브카테고리 추가'}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-500">
          대카테고리: <span className="font-mono text-gray-700">{categorySlug}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div>
              <label htmlFor="sub-slug" className={LABEL_CLASS}>
                슬러그 <span className="text-red-500">*</span>
              </label>
              <input
                id="sub-slug"
                type="text"
                required
                value={values.slug}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, slug: event.target.value }))
                }
                className={cn(INPUT_CLASS, 'font-mono')}
                placeholder="image-bg-remove"
              />
            </div>
          )}

          {isEdit && (
            <div>
              <span className={LABEL_CLASS}>슬러그</span>
              <p className="rounded-lg bg-gray-50 px-3 py-2 font-mono text-sm text-gray-700">
                {values.slug}
              </p>
            </div>
          )}

          <div>
            <label htmlFor="sub-name" className={LABEL_CLASS}>
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              id="sub-name"
              type="text"
              required
              value={values.name}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, name: event.target.value }))
              }
              className={INPUT_CLASS}
              placeholder="배경 제거"
            />
          </div>

          <div>
            <label htmlFor="sub-sort" className={LABEL_CLASS}>
              정렬 순서
            </label>
            <input
              id="sub-sort"
              type="number"
              min={0}
              value={values.sort_order}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  sort_order: Number(event.target.value),
                }))
              }
              className={INPUT_CLASS}
            />
          </div>

          {isEdit && (
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={values.is_active}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    is_active: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">활성화</span>
            </label>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '저장 중…' : isEdit ? '저장' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
