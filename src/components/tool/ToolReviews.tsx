'use client';

import { Heart, Loader2, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { StarRatingDisplay, StarRatingInput } from '@/components/tool/StarRating';
import { useLoginPrompt } from '@/contexts/LoginPromptContext';
import { useLocale } from '@/contexts/LocaleContext';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { ReviewListResponse, ReviewSort, ToolReview } from '@/types/review';

interface ToolReviewsProps {
  toolId: string;
}

const SORT_OPTIONS: { value: ReviewSort; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'recommended', label: '추천순' },
];

function formatReviewDate(date: string) {
  return new Date(date).toLocaleDateString('ko-KR', {
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
}: {
  review: ToolReview;
  onEdit: (review: ToolReview) => void;
  onDelete: (review: ToolReview) => void;
  onToggleLike: (review: ToolReview) => void;
  liking: boolean;
}) {
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
              {formatReviewDate(review.created_at)}
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
            {review.like_count.toLocaleString('ko-KR')}
          </button>
        </div>

        {review.is_own && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(review)}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="리뷰 수정"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(review)}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
              aria-label="리뷰 삭제"
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
  const { t } = useLocale();
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
        throw new Error(typeof json.error === 'string' ? json.error : '리뷰 조회 실패');
      }
      setData(json as ReviewListResponse);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : '리뷰 조회 실패');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [toolId, page, sort, ratingFilter]);

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
        throw new Error(typeof json.error === 'string' ? json.error : '저장 실패');
      }

      setFormContent('');
      setFormRating(5);
      setEditingReview(null);
      setPage(1);
      await fetchReviews();
    } catch (submitError) {
      window.alert(
        submitError instanceof Error ? submitError.message : '저장에 실패했습니다.',
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
    if (!window.confirm('리뷰를 삭제할까요?')) return;

    const response = await fetch(`/api/reviews/${review.id}`, { method: 'DELETE' });
    if (!response.ok) {
      const json = await response.json();
      window.alert(typeof json.error === 'string' ? json.error : '삭제 실패');
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
        throw new Error(typeof json.error === 'string' ? json.error : '요청 실패');
      }
      await fetchReviews();
    } catch (likeError) {
      window.alert(likeError instanceof Error ? likeError.message : '요청 실패');
    } finally {
      setLikingId(null);
    }
  };

  const summary = data?.summary;
  const canWrite = userId && !data?.userReview && !editingReview;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">리뷰</h2>
        {summary && summary.totalReviews > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <StarRatingDisplay value={summary.averageRating} size="sm" />
            <span className="font-medium text-gray-900">
              {summary.averageRating.toFixed(1)}
            </span>
            <span>({summary.totalReviews.toLocaleString('ko-KR')}개)</span>
          </div>
        )}
      </div>

      {(canWrite || editingReview) && (
        <form onSubmit={handleSubmit} className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-900">
            {editingReview ? '리뷰 수정' : '리뷰 작성'}
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
            placeholder="이 서비스에 대한 경험을 공유해 주세요."
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
              {submitting ? '저장 중…' : editingReview ? '수정' : '등록'}
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
                취소
              </button>
            )}
          </div>
        </form>
      )}

      {!userId && (
        <p className="mt-4 text-sm text-gray-500">
          리뷰를 작성하려면{' '}
          <button
            type="button"
            onClick={showLoginPrompt}
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            로그인
          </button>
          이 필요합니다.
        </p>
      )}

      {userId && data?.userReview && !editingReview && (
        <p className="mt-4 text-sm text-gray-500">
          이미 리뷰를 작성하셨습니다. 우측 버튼으로 수정·삭제할 수 있습니다.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((option) => (
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
          <option value="">별점 전체</option>
          {[5, 4, 3, 2, 1].map((rating) => (
            <option key={rating} value={rating}>
              {rating}점
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          불러오는 중…
        </div>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      ) : !data || data.reviews.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          {ratingFilter ? '해당 별점의 리뷰가 없습니다.' : '아직 리뷰가 없습니다.'}
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
                이전
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
                다음
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
