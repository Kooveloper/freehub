'use client';

import { Loader2, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { StarRatingDisplay, StarRatingInput } from '@/components/tool/StarRating';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import type { ToolReview } from '@/types/review';

export function UserReviewsSection() {
  const { t } = useLocale();
  const [reviews, setReviews] = useState<ToolReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/reviews/mine');
      const json = await response.json();
      if (!response.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : '조회 실패');
      }
      setReviews(json.reviews as ToolReview[]);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : '조회 실패');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const startEdit = (review: ToolReview) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditContent(review.content);
  };

  const handleSave = async (reviewId: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: editRating, content: editContent.trim() }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : '저장 실패');
      }
      setEditingId(null);
      await fetchReviews();
    } catch (saveError) {
      window.alert(saveError instanceof Error ? saveError.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm(t('dashboard.reviewDeleteConfirm'))) return;

    const response = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
    if (!response.ok) {
      const json = await response.json();
      window.alert(typeof json.error === 'string' ? json.error : '삭제 실패');
      return;
    }
    await fetchReviews();
  };

  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900">{t('dashboard.myReviews')}</h2>
      <p className="mt-1 text-sm text-gray-500">{t('dashboard.myReviewsDescription')}</p>

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t('common.loading')}
        </div>
      ) : error ? (
        <p className="py-8 text-sm text-red-600">{error}</p>
      ) : reviews.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">
          {t('dashboard.myReviewsEmpty')}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-gray-100">
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
                    maxLength={2000}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleSave(review.id)}
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      {t('common.save')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {review.tool_name && review.tool_slug && (
                      <Link
                        href={`/tool/${review.tool_slug}`}
                        className="text-sm font-semibold text-gray-900 hover:text-brand-600"
                      >
                        {review.tool_name}
                      </Link>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <StarRatingDisplay value={review.rating} size="sm" />
                      <span className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    {review.content.trim() && (
                      <p className="mt-2 text-sm text-gray-700">{review.content}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(review)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      aria-label={t('common.save')}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(review.id)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                      aria-label="delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
