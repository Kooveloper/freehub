'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { CategoryIcon } from '@/components/category/CategoryIcon';
import {
  CATEGORY_COLOR_OPTIONS,
  type CategoryColor,
} from '@/constants/category-colors';
import { SLUG_PATTERN } from '@/lib/admin/categories';
import {
  getCategoryIconType,
  isValidCategoryIcon,
} from '@/lib/category-icon';
import { cn } from '@/lib/utils';
import type { AdminCategory } from '@/lib/supabase/admin-queries';

export interface CategoryFormValues {
  slug: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  icon: string;
  color: CategoryColor;
  sort_order: number;
}

type IconInputType = 'emoji' | 'image';

interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: AdminCategory | null;
  nextSortOrder: number;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
}

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-gray-700';

function buildInitialValues(
  category: AdminCategory | null | undefined,
  nextSortOrder: number,
): CategoryFormValues {
  if (category) {
    return {
      slug: category.slug,
      name: category.name,
      name_en: category.name_en ?? '',
      description: category.description,
      description_en: category.description_en ?? '',
      icon: category.icon,
      color: (category.color as CategoryColor) || 'blue',
      sort_order: category.sort_order,
    };
  }

  return {
    slug: '',
    name: '',
    name_en: '',
    description: '',
    description_en: '',
    icon: '',
    color: 'blue',
    sort_order: nextSortOrder,
  };
}

function CategoryForm({
  category,
  nextSortOrder,
  onSubmit,
  onClose,
}: {
  category?: AdminCategory | null;
  nextSortOrder: number;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
  onClose: () => void;
}) {
  const isEdit = Boolean(category);
  const [values, setValues] = useState<CategoryFormValues>(() =>
    buildInitialValues(category, nextSortOrder),
  );
  const [iconType, setIconType] = useState<IconInputType>(() => {
    const type = getCategoryIconType(values.icon);
    return type === 'image' ? 'image' : 'emoji';
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleIconTypeChange = (next: IconInputType) => {
    setIconType(next);
    setValues((prev) => ({ ...prev, icon: '' }));
  };

  const validateForm = (): string | null => {
    if (!isEdit && !SLUG_PATTERN.test(values.slug.trim())) {
      return '슬러그는 영문 소문자와 하이픈만 사용할 수 있습니다.';
    }
    if (!values.name.trim()) return '이름(한국어)을 입력해주세요.';
    if (!values.description.trim()) return '설명(한국어)을 입력해주세요.';
    if (!isValidCategoryIcon(values.icon)) {
      return iconType === 'image'
        ? '아이콘 이미지 URL을 확인해주세요.'
        : '아이콘 이모지를 입력해주세요.';
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...values,
        slug: values.slug.trim(),
        name: values.name.trim(),
        name_en: values.name_en.trim(),
        description: values.description.trim(),
        description_en: values.description_en.trim(),
        icon: values.icon.trim(),
      });
      onClose();
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
    <div
      className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
      onClick={(event) => event.stopPropagation()}
      role="document"
    >
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? '카테고리 수정' : '카테고리 추가'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            카테고리 정보를 입력하세요.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="category-slug" className={LABEL_CLASS}>
            슬러그
          </label>
          <input
            id="category-slug"
            type="text"
            value={values.slug}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, slug: event.target.value }))
            }
            placeholder="ai-chat"
            disabled={isEdit}
            required={!isEdit}
            className={cn(INPUT_CLASS, isEdit && 'bg-gray-50 text-gray-500')}
          />
          {isEdit && (
            <p className="mt-1 text-xs text-gray-400">
              슬러그는 수정할 수 없습니다.
            </p>
          )}
        </div>

        <div>
          <span className={LABEL_CLASS}>이름</span>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="category-name"
                className="mb-1 block text-xs text-gray-500"
              >
                한국어 *
              </label>
              <input
                id="category-name"
                type="text"
                value={values.name}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="AI 채팅"
                required
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label
                htmlFor="category-name-en"
                className="mb-1 block text-xs text-gray-500"
              >
                English
              </label>
              <input
                id="category-name-en"
                type="text"
                value={values.name_en}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    name_en: event.target.value,
                  }))
                }
                placeholder="AI Chat"
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </div>

        <div>
          <span className={LABEL_CLASS}>설명</span>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="category-description"
                className="mb-1 block text-xs text-gray-500"
              >
                한국어 *
              </label>
              <textarea
                id="category-description"
                value={values.description}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                rows={3}
                required
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label
                htmlFor="category-description-en"
                className="mb-1 block text-xs text-gray-500"
              >
                English
              </label>
              <textarea
                id="category-description-en"
                value={values.description_en}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    description_en: event.target.value,
                  }))
                }
                rows={3}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </div>

        <div>
          <span className={LABEL_CLASS}>아이콘</span>
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => handleIconTypeChange('emoji')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                iconType === 'emoji'
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              이모지
            </button>
            <button
              type="button"
              onClick={() => handleIconTypeChange('image')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                iconType === 'image'
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              이미지 URL (PNG)
            </button>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
              {values.icon ? (
                <CategoryIcon name={values.icon} size={28} />
              ) : (
                <span className="text-xs text-gray-400">미리보기</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              {iconType === 'emoji' ? (
                <input
                  id="category-icon"
                  type="text"
                  value={values.icon}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, icon: event.target.value }))
                  }
                  placeholder="💬"
                  maxLength={8}
                  className={INPUT_CLASS}
                />
              ) : (
                <input
                  id="category-icon-url"
                  type="url"
                  value={values.icon}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, icon: event.target.value }))
                  }
                  placeholder="https://example.com/icon.png"
                  className={INPUT_CLASS}
                />
              )}
              <p className="mt-1 text-xs text-gray-400">
                {iconType === 'emoji'
                  ? '이모지 1개를 입력하세요 (예: 💬, 🎨)'
                  : 'PNG 등 이미지 URL을 입력하세요'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category-order" className={LABEL_CLASS}>
              순서
            </label>
            <input
              id="category-order"
              type="number"
              min={0}
              value={values.sort_order}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  sort_order: Number(event.target.value),
                }))
              }
              required
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-gray-700">
            색상
          </span>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLOR_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setValues((prev) => ({ ...prev, color: option.value }))
                }
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                  values.color === option.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
                )}
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: option.hex }}
                />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? '저장 중...' : isEdit ? '수정' : '추가'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function CategoryModal({
  open,
  onOpenChange,
  category,
  nextSortOrder,
  onSubmit,
}: CategoryModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const handleClose = () => onOpenChange(false);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
    >
      <CategoryForm
        key={category?.id ?? `new-${nextSortOrder}`}
        category={category}
        nextSortOrder={nextSortOrder}
        onSubmit={onSubmit}
        onClose={handleClose}
      />
    </div>
  );
}
