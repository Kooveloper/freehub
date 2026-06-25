'use client';

import { Loader2, Pencil, Trash2, User } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ADMIN_DASHBOARD_BODY_CELL_CLASS,
  ADMIN_DASHBOARD_HEAD_CELL_CLASS,
  ADMIN_DASHBOARD_HEAD_ROW_CLASS,
  ADMIN_DASHBOARD_TABLE_CLASS,
  ADMIN_TABLE_ACTIONS_CLASS,
} from '@/components/admin/admin-table';
import { StarRatingDisplay, StarRatingInput } from '@/components/tool/StarRating';
import { cn } from '@/lib/utils';
import type { ToolReview } from '@/types/review';

const PAGE_SIZE = 20;

interface ReviewLatestTableProps {
  from: string;
  to: string;
  search: string;
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

export function ReviewLatestTable({ from, to, search }: ReviewLatestTableProps) {
  const [reviews, setReviews] = useState<ToolReview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const query = search.trim().toLowerCase();

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      from,
      to,
    });

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
  }, [from, to, page]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    setPage(1);
  }, [from, to, search]);

  const filteredReviews = useMemo(() => {
    if (!query) return reviews;
    return reviews.filter((review) => {
      const haystack = [
        review.author_nickname,
        review.tool_name ?? '',
        review.tool_slug ?? '',
        review.content,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [reviews, query]);

  const startEdit = (review: ToolReview) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditContent(review.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRating(5);
    setEditContent('');
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
      cancelEdit();
      await fetchReviews();
    } catch (saveError) {
      window.alert(saveError instanceof Error ? saveError.message : '수정 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('리뷰를 삭제할까요?')) return;

    setPendingId(reviewId);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : '삭제 실패');
      }
      if (editingId === reviewId) {
        cancelEdit();
      }
      await fetchReviews();
    } catch (deleteError) {
      window.alert(deleteError instanceof Error ? deleteError.message : '삭제 실패');
    } finally {
      setPendingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        최신 리뷰를 불러오는 중…
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-10 text-center text-sm text-red-600">{error}</div>
    );
  }

  if (filteredReviews.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-sm text-gray-500">
        {query ? '검색 결과가 없습니다.' : '해당 기간에 작성된 리뷰가 없습니다.'}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className={cn(ADMIN_DASHBOARD_TABLE_CLASS, 'min-w-[1100px]')}>
          <thead>
            <tr className={ADMIN_DASHBOARD_HEAD_ROW_CLASS}>
              <th className={ADMIN_DASHBOARD_HEAD_CELL_CLASS}>작성 시간</th>
              <th className={ADMIN_DASHBOARD_HEAD_CELL_CLASS}>서비스</th>
              <th className={ADMIN_DASHBOARD_HEAD_CELL_CLASS}>작성자</th>
              <th className={ADMIN_DASHBOARD_HEAD_CELL_CLASS}>평점</th>
              <th className={ADMIN_DASHBOARD_HEAD_CELL_CLASS}>리뷰 내용</th>
              <th className={cn(ADMIN_DASHBOARD_HEAD_CELL_CLASS, 'text-center')}>
                관리
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.map((review) => (
              <tr key={review.id} className="border-b border-gray-50 align-top last:border-0">
                {editingId === review.id ? (
                  <td colSpan={6} className="bg-blue-50/40 px-5 py-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <span>{formatDateTime(review.created_at)}</span>
                        <span>·</span>
                        <span>{review.tool_name ?? '-'}</span>
                        <span>·</span>
                        <span>{review.author_nickname}</span>
                      </div>
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
                        placeholder="리뷰 내용 (선택)"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void handleSave(review.id)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {saving ? '저장 중…' : '저장'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  </td>
                ) : (
                  <>
                    <td className={cn(ADMIN_DASHBOARD_BODY_CELL_CLASS, 'whitespace-nowrap text-gray-600')}>
                      {formatDateTime(review.created_at)}
                    </td>
                    <td className={ADMIN_DASHBOARD_BODY_CELL_CLASS}>
                      {review.tool_slug ? (
                        <Link
                          href={`/tool/${review.tool_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {review.tool_name ?? review.tool_slug}
                        </Link>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className={ADMIN_DASHBOARD_BODY_CELL_CLASS}>
                      <span className="font-medium text-gray-900">
                        {review.author_nickname}
                      </span>
                    </td>
                    <td className={ADMIN_DASHBOARD_BODY_CELL_CLASS}>
                      <StarRatingDisplay value={review.rating} size="sm" />
                    </td>
                    <td className={cn(ADMIN_DASHBOARD_BODY_CELL_CLASS, 'max-w-md')}>
                      {review.content.trim() ? (
                        <p className="whitespace-pre-wrap text-sm text-gray-700">
                          {review.content}
                        </p>
                      ) : (
                        <span className="text-sm text-gray-400">(내용 없음)</span>
                      )}
                    </td>
                    <td className={ADMIN_DASHBOARD_BODY_CELL_CLASS}>
                      <div className={ADMIN_TABLE_ACTIONS_CLASS}>
                        <Link
                          href={`/admin/users/${review.user_id}`}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                          title="회원 정보"
                        >
                          <User className="h-3.5 w-3.5" />
                          회원
                        </Link>
                        <button
                          type="button"
                          onClick={() => startEdit(review)}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          수정
                        </button>
                        <button
                          type="button"
                          disabled={pendingId === review.id}
                          onClick={() => void handleDelete(review.id)}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          삭제
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 border-t border-gray-200 px-5 py-4">
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
            <span className="ml-2 text-gray-400">
              (총 {total.toLocaleString('ko-KR')}개)
            </span>
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
    </>
  );
}
