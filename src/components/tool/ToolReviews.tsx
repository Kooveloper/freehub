'use client';

import { Heart, Loader2, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { StarRatingDisplay, StarRatingInput } from '@/components/tool/StarRating';
import { useLoginPrompt } from '@/contexts/LoginPromptContext';
import { useLocale } from '@/contexts/LocaleContext';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { ReviewListResponse, ReviewSort, ToolReview } from '@/types/review';

interface ToolReviewsProps {
  toolId: string;
}

function formatReviewDate(date: string, locale: 'ko' | 'en') {
  return new Date(date).toLocaleDateString(locale === 'en' ? 'en-US' : 'ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function ReviewItem({
  review,
  onEdit,
  onDelete,
  onToggleLike,
  liking,
  locale,
  t,
}: {
  review: ToolReview;
  onEdit: (review: ToolReview) => void;
  onDelete: (review: ToolReview) => void;
  onToggleLike: (review: ToolReview) => void;
  liking: boolean;
  locale: 'ko' | 'en';
  t: ReturnType<typeof useLocale>['t'];
}) {
  const numberLocale = locale === 'en' ? 'en-US' : 'ko-KR';

  return (
    <article className="border-b border-gray-100 py-4 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StarRatingDisplay value={review.rating} size="sm" />
            <span className="text-sm font-medium text-gray-900">
              {review.author_nickname}
            </span>
            <span className="text-xs text-gray-400">
              {formatReviewDate(review.created_at, locale)}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {review.content}
          </p>
          <button
            type="button"
            disabled={liking}
            onClick={() => onToggleLike(review)}
            className={cn(
              'mt-2 inline-flex items-center gap-1 text-xs font-medium transition-colors',
              review.is_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500',
            )}
          >
            <Heart
              className={cn('h-3.5 w-3.5', review.is_liked && 'fill-current')}
            />
            {review.like_count.toLocaleString(numberLocale)}
          </button>
        </div>

        {review.is_own && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(review)}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label={t('reviews.editAria')}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(review)}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
              aria-label={t('reviews.deleteAria')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export function ToolReviews({ toolId }: ToolReviewsProps) {
  const { showLoginPrompt } = useLoginPrompt();
  const { locale, t } = useLocale();
  const numberLocale = locale === 'en' ? 'en-US' : 'ko-KR';
  const sortOptions = useMemo(
    () =>
      [
        { value: 'latest' as const, label: t('reviews.sortLatest') },
        { value: 'recommended' as const, label: t('reviews.sortRecommended') },
      ] satisfies { value: ReviewSort; label: string }[],
    [t],
  );

  const [data, setData] = useState<ReviewListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ReviewSort>('latest');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [formRating, setFormRating] = useState(5);
  const [formContent, setFormContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState<ToolReview | null>(null);
  const [likingId, setLikingId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      toolId,
      page: String(page),
      sort,
    });
    if (ratingFilter) {
      params.set('rating', String(ratingFilter));
    }

    try {
      const response = await fetch(`/api/reviews?${params}`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof json.error === 'string' ? json.error : t('reviews.fetchFailed'),
        );
      }
      setData(json as ReviewListResponse);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error ? fetchError.message : t('reviews.fetchFailed'),
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [toolId, page, sort, ratingFilter, t]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!userId) {
      showLoginPrompt();
      return;
    }

    if (!formContent.trim()) return;

    setSubmitting(true);
    try {
      const isEdit = Boolean(editingReview);
      const response = await fetch(
        isEdit ? `/api/reviews/${editingReview!.id}` : '/api/reviews',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            isEdit
              ? { rating: formRating, content: formContent.trim() }
              : { toolId, rating: formRating, content: formContent.trim() },
          ),
        },
      );

      const json = await response.json();
      if (!response.ok) {
        if (json.code === 'PROFILE_REQUIRED') {
          window.location.href = '/signup/complete';
          return;
        }
        throw new Error(typeof json.error === 'string' ? json.error : t('reviews.saveFailed'));
      }

      setFormContent('');
      setFormRating(5);
      setEditingReview(null);
      setPage(1);
      await fetchReviews();
    } catch (submitError) {
      window.alert(
        submitError instanceof Error ? submitError.message : t('reviews.saveFailed'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review: ToolReview) => {
    setEditingReview(review);
    setFormRating(review.rating);
    setFormContent(review.content);
  };

  const handleDelete = async (review: ToolReview) => {
    if (!window.confirm(t('reviews.deleteConfirm'))) return;

    const response = await fetch(`/api/reviews/${review.id}`, { method: 'DELETE' });
    if (!response.ok) {
      const json = await response.json();
      window.alert(typeof json.error === 'string' ? json.error : t('reviews.deleteFailed'));
      return;
    }

    if (editingReview?.id === review.id) {
      setEditingReview(null);
      setFormContent('');
      setFormRating(5);
    }
    await fetchReviews();
  };

  const handleToggleLike = async (review: ToolReview) => {
    if (!userId) {
      showLoginPrompt();
      return;
    }

    setLikingId(review.id);
    try {
      const response = await fetch(`/api/reviews/${review.id}/like`, {
        method: review.is_liked ? 'DELETE' : 'POST',
      });
      if (!response.ok) {
        const json = await response.json();
        throw new Error(typeof json.error === 'string' ? json.error : t('reviews.requestFailed'));
      }
      await fetchReviews();
    } catch (likeError) {
      window.alert(
        likeError instanceof Error ? likeError.message : t('reviews.requestFailed'),
      );
    } finally {
      setLikingId(null);
    }
  };

  const summary = data?.summary;
  const canWrite = userId && !data?.userReview && !editingReview;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">{t('reviews.title')}</h2>
        {summary && summary.totalReviews > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <StarRatingDisplay value={summary.averageRating} size="sm" />
            <span className="font-medium text-gray-900">
              {summary.averageRating.toFixed(1)}
            </span>
            <span>
              {t('reviews.count', {
                count: summary.totalReviews.toLocaleString(numberLocale),
              })}
            </span>
          </div>
        )}
      </div>

      {(canWrite || editingReview) && (
        <form onSubmit={handleSubmit} className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-900">
            {editingReview ? t('reviews.edit') : t('reviews.write')}
          </p>
          <div className="mt-3">
            <StarRatingInput
              value={formRating}
              onChange={setFormRating}
              disabled={submitting}
            />
          </div>
          <textarea
            value={formContent}
            onChange={(event) => setFormContent(event.target.value)}
            placeholder={t('reviews.placeholder')}
            rows={4}
            maxLength={2000}
            disabled={submitting}
            className="mt-3 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting || !formContent.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting
                ? t('reviews.saving')
                : editingReview
                  ? t('reviews.editButton')
                  : t('common.register')}
            </button>
            {editingReview && (
              <button
                type="button"
                onClick={() => {
                  setEditingReview(null);
                  setFormContent('');
                  setFormRating(5);
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                {t('common.cancel')}
              </button>
            )}
          </div>
        </form>
      )}

      {!userId && (
        <p className="mt-4 text-sm text-gray-500">
          {t('reviews.loginRequired')}{' '}
          <button
            type="button"
            onClick={showLoginPrompt}
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            {t('reviews.login')}
          </button>
          {t('reviews.loginRequiredSuffix')}
        </p>
      )}

      {userId && data?.userReview && !editingReview && (
        <p className="mt-4 text-sm text-gray-500">{t('reviews.alreadyWritten')}</p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setSort(option.value);
                setPage(1);
              }}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                sort === option.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <select
          value={ratingFilter ?? ''}
          onChange={(event) => {
            const value = event.target.value;
            setRatingFilter(value ? Number(value) : null);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700"
        >
          <option value="">{t('reviews.ratingAll')}</option>
          {[5, 4, 3, 2, 1].map((rating) => (
            <option key={rating} value={rating}>
              {t('reviews.ratingPoints', { rating })}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t('reviews.loading')}
        </div>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      ) : !data || data.reviews.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          {ratingFilter ? t('reviews.emptyFiltered') : t('reviews.empty')}
        </p>
      ) : (
        <>
          <div className="mt-2">
            {data.reviews.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleLike={handleToggleLike}
                liking={likingId === review.id}
                locale={locale}
                t={t}
              />
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40"
              >
                {t('reviews.prev')}
              </button>
              <span className="text-sm text-gray-500">
                {page} / {data.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= data.totalPages}
                onClick={() =>
                  setPage((current) => Math.min(data.totalPages, current + 1))
                }
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40"
              >
                {t('reviews.next')}
              </button>
            </div>
          )}
        </>
      )}

      {userId && !data?.userReview && (
        <p className="mt-4 text-xs text-gray-400">
          {t('dashboard.nicknameEditHint')}{' '}
          <Link
            href="/dashboard/profile"
            className="text-brand-600 hover:underline"
          >
            {t('dashboard.myPageLink')}
          </Link>
          {t('dashboard.nicknameEditSuffix')}
        </p>
      )}
    </section>
  );
}
