'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { CATEGORY_EMOJI } from '@/constants/categoryCta';
import { createKeywordItemId } from '@/lib/blog/keyword-items';
import { cn } from '@/lib/utils';
import { isBlogTargetCategory } from '@/types/blog';
import type { KeywordItem } from '@/types/blog';
import type { Category, SubCategory } from '@/types/tool';

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-gray-700';

interface BlogKeywordSettingsProps {
  categories: Category[];
  keywords: KeywordItem[];
  onChange: (keywords: KeywordItem[]) => void;
}

interface KeywordDraft {
  keyword: string;
  category: string;
  sub_category: string;
}

const EMPTY_DRAFT: KeywordDraft = {
  keyword: '',
  category: '',
  sub_category: '',
};

export function BlogKeywordSettings({
  categories,
  keywords,
  onChange,
}: BlogKeywordSettingsProps) {
  const [draft, setDraft] = useState<KeywordDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subCategoryBySlug, setSubCategoryBySlug] = useState<
    Record<string, SubCategory[]>
  >({});
  const fetchedSlugsRef = useRef<Set<string>>(new Set());

  const orderedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );

  const subCategories = subCategoryBySlug[draft.category] ?? [];

  const allSubCategories = useMemo(
    () => Object.values(subCategoryBySlug).flat(),
    [subCategoryBySlug],
  );

  useEffect(() => {
    const slugs = new Set<string>();
    if (draft.category) slugs.add(draft.category);
    keywords.forEach((item) => {
      if (item.category) slugs.add(item.category);
    });

    slugs.forEach((slug) => {
      if (fetchedSlugsRef.current.has(slug)) return;
      fetchedSlugsRef.current.add(slug);

      void fetch(
        `/api/admin/sub-categories?category_slug=${encodeURIComponent(slug)}`,
      )
        .then((res) => res.json())
        .then((data) => {
          setSubCategoryBySlug((prev) => ({
            ...prev,
            [slug]: (data.subCategories ?? []) as SubCategory[],
          }));
        })
        .catch(() => {
          fetchedSlugsRef.current.delete(slug);
        });
    });
  }, [draft.category, keywords]);

  const canSubmit =
    draft.keyword.trim().length > 0 && Boolean(draft.category) && Boolean(draft.sub_category);

  const resetDraft = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    const nextItem: KeywordItem = {
      id: editingId ?? createKeywordItemId(),
      keyword: draft.keyword.trim(),
      category: draft.category,
      sub_category: draft.sub_category,
    };

    if (editingId) {
      onChange(keywords.map((item) => (item.id === editingId ? nextItem : item)));
    } else {
      onChange([...keywords, nextItem]);
    }

    resetDraft();
  };

  const startEdit = (item: KeywordItem) => {
    setEditingId(item.id);
    setDraft({
      keyword: item.keyword,
      category: item.category,
      sub_category: item.sub_category,
    });
  };

  const handleDelete = (item: KeywordItem) => {
    if (!window.confirm(`"${item.keyword}" 키워드를 삭제할까요?`)) return;
    onChange(keywords.filter((keyword) => keyword.id !== item.id));
    if (editingId === item.id) {
      resetDraft();
    }
  };

  const getCategoryName = (slug: string) =>
    orderedCategories.find((category) => category.slug === slug)?.name ?? slug;

  const getSubCategoryName = (slug: string) =>
    allSubCategories.find((sub) => sub.slug === slug)?.name ?? slug;

  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-500">
        각 키워드는 등록된 서브카테고리의 실제 FreeHub 서비스 정보를 기반으로 블로그 글이
        자동 생성됩니다. 키워드는 추가된 순서대로 매일 순환하며 사용됩니다.
      </p>

      <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div>
          <label htmlFor="blog-keyword-input" className={LABEL_CLASS}>
            키워드
          </label>
          <input
            id="blog-keyword-input"
            type="text"
            value={draft.keyword}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, keyword: event.target.value }))
            }
            placeholder="예: 무료 배경 제거"
            className={INPUT_CLASS}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="blog-keyword-category" className={LABEL_CLASS}>
              대카테고리
            </label>
            <select
              id="blog-keyword-category"
              value={draft.category}
              onChange={(event) =>
                setDraft({
                  keyword: draft.keyword,
                  category: event.target.value,
                  sub_category: '',
                })
              }
              className={INPUT_CLASS}
            >
              <option value="">카테고리 선택</option>
              {orderedCategories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {isBlogTargetCategory(category.slug)
                    ? `${CATEGORY_EMOJI[category.slug]} ${category.name}`
                    : category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="blog-keyword-sub-category" className={LABEL_CLASS}>
              서브카테고리
            </label>
            <select
              id="blog-keyword-sub-category"
              value={draft.sub_category}
              disabled={!draft.category}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, sub_category: event.target.value }))
              }
              className={cn(INPUT_CLASS, 'disabled:bg-gray-100 disabled:text-gray-400')}
            >
              <option value="">
                {!draft.category ? '먼저 카테고리를 선택하세요' : '서브카테고리 선택'}
              </option>
              {subCategories.map((sub) => (
                <option key={sub.slug} value={sub.slug}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {editingId ? '수정 완료' : '+ 키워드 추가'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetDraft}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
            >
              취소
            </button>
          )}
        </div>
      </div>

      {keywords.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
          등록된 키워드가 없습니다. 키워드를 추가해주세요.
        </p>
      ) : (
        <ul className="space-y-2">
          {keywords.map((item) => {
            const categoryEmoji = isBlogTargetCategory(item.category)
              ? CATEGORY_EMOJI[item.category]
              : null;

            return (
              <li
                key={item.id}
                className={cn(
                  'flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between',
                  editingId === item.id && 'border-blue-300 ring-1 ring-blue-200',
                )}
              >
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="text-sm font-medium text-gray-900">{item.keyword}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {categoryEmoji ? `${categoryEmoji} ` : ''}
                    {getCategoryName(item.category)}
                    {' > '}
                    {getSubCategoryName(item.sub_category)}
                  </p>
                </button>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    삭제
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
