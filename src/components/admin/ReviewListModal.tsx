'use client';

import { X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { StarRatingDisplay, StarRatingInput } from '@/components/tool/StarRating';
import { cn } from '@/lib/utils';
import type { ToolReview } from '@/types/review';

export interface ReviewListFilter {
  toolId?: string;
  categorySlug?: string;
  subCategorySlug?: string;
  title: string;
}

interface ReviewListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: ReviewListFilter | null;
  admin?: boolean;
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function ReviewListModal({
  open,
  onOpenChange,
  filter,
  admin = false,
}: ReviewListModalProps) {
  const [reviews, setReviews] = useState<ToolReview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fetchReviews = useCallback(async () => {
    if (!filter) return;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (filter.toolId) params.set('toolId', filter.toolId);
    if (filter.categorySlug) params.set('categorySlug', filter.categorySlug);
    if (filter.subCategorySlug) params.set('subCategorySlug', filter.subCategorySlug);

    try {
      const response = await fetch(`/api/admin/reviews?${params}`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : '리뷰 조회 실패');
      }
      setReviews(json.reviews as ToolReview[]);
      setTotal(json.total as number);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : '리뷰 조회 실패');
      setReviews([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    if (open && filter) {
      void fetchReviews();
    }
  }, [open, filter, fetchReviews]);

  useEffect(() => {
    if (open) {
      setPage(1);
      setEditingId(null);
    }
  }, [open, filter]);

  if (!open || !filter) return null;

  const handleEditStart = (review: ToolReview) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditContent(review.content);
  };

  const handleSave = async (reviewId: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: editRating, content: editContent.trim() }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : '수정 실패');
      }
      setEditingId(null);
      await fetchReviews();
    } catch (saveError) {
      window.alert(saveError instanceof Error ? saveError.message : '수정 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('리뷰를 삭제할까요?')) return;

    const response = await fetch(`/api/admin/reviews/${reviewId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const json = await response.json();
      window.alert(typeof json.error === 'string' ? json.error : '삭제 실패');
      return;
    }
    await fetchReviews();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="닫기"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{filter.title}</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              총 {total.toLocaleString('ko-KR')}개
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-gray-500">불러오는 중…</p>
          ) : error ? (
            <p className="py-10 text-center text-sm text-red-600">{error}</p>
          ) : reviews.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">리뷰가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {reviews.map((review) => (
                <li key={review.id} className="py-4">
                  {editingId === review.id ? (
                    <div className="space-y-3">
                      <StarRatingInput
                        value={editRating}
                        onChange={setEditRating}
                        disabled={saving}
                      />
                      <textarea
                        value={editContent}
                        onChange={(event) => setEditContent(event.target.value)}
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void handleSave(review.id)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StarRatingDisplay value={review.rating} size="sm" />
                          <span className="text-sm font-medium text-gray-900">
                            {review.author_nickname}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDateTime(review.created_at)}
                          </span>
                        </div>
                        {review.tool_name && (
                          <p className="mt-1 text-xs text-gray-500">
                            {review.tool_name}
                            {review.tool_slug ? ` (${review.tool_slug})` : ''}
                          </p>
                        )}
                        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                          {review.content}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          좋아요 {review.like_count.toLocaleString('ko-KR')}
                        </p>
                      </div>
                      {admin && (
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditStart(review)}
                            className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(review.id)}
                            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-gray-200 px-5 py-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              이전
            </button>
            <span className="text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
