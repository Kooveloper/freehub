'use client';

import { Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Toast, useToast } from '@/components/admin/Toast';
import {
  ADMIN_TABLE_ACTIONS_CLASS,
  ADMIN_TABLE_CLASS,
  ADMIN_TABLE_HEAD_ROW_CLASS,
} from '@/components/admin/admin-table';
import { Badge } from '@/components/ui/Badge';
import { CATEGORIES } from '@/constants/categories';
import {
  formatBlogDateTime,
  getBlogCategoryLabel,
} from '@/lib/blog-utils';
import { cn } from '@/lib/utils';
import type { BlogPost, BlogPostSource, BlogPostStatus } from '@/types/blog';

const PAGE_SIZE = 20;

interface BlogPostsManagerProps {
  posts: BlogPost[];
}

async function parseApiError(response: Response) {
  const data = await response.json().catch(() => ({}));
  throw new Error(
    typeof data.error === 'string' ? data.error : '요청에 실패했습니다.',
  );
}

function StatusBadge({ status }: { status: BlogPostStatus }) {
  return (
    <Badge variant={status === 'published' ? 'green' : 'gray'}>
      {status === 'published' ? '발행됨' : '초안'}
    </Badge>
  );
}

function SourceBadge({ source }: { source: BlogPostSource }) {
  return (
    <Badge variant={source === 'auto' ? 'purple' : 'blue'}>
      {source === 'auto' ? '🤖 자동' : '✍️ 수동'}
    </Badge>
  );
}

export function BlogPostsManager({ posts: initialPosts }: BlogPostsManagerProps) {
  const { toast, showToast, hideToast } = useToast();
  const [posts, setPosts] = useState(initialPosts);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BlogPostStatus>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | BlogPostSource>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((post) => {
      if (statusFilter !== 'all' && post.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && post.source !== sourceFilter) return false;
      if (categoryFilter !== 'all' && post.category !== categoryFilter) return false;
      if (q && !post.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [posts, search, statusFilter, sourceFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagePosts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (pagePosts.every((p) => selected.has(p.id))) {
      setSelected((prev) => {
        const next = new Set(prev);
        pagePosts.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        pagePosts.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 글을 삭제하시겠습니까?')) return;
    setPendingId(id);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
      if (!res.ok) await parseApiError(res);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      showToast('글이 삭제되었습니다.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '삭제 실패', 'error');
    } finally {
      setPendingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`선택한 ${selected.size}개 글을 삭제하시겠습니까?`)) return;

    setPendingId('bulk');
    try {
      await Promise.all(
        [...selected].map((id) =>
          fetch(`/api/admin/blog/${id}`, { method: 'DELETE' }).then(async (res) => {
            if (!res.ok) await parseApiError(res);
          }),
        ),
      );
      setPosts((prev) => prev.filter((p) => !selected.has(p.id)));
      setSelected(new Set());
      showToast('선택한 글이 삭제되었습니다.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '삭제 실패', 'error');
    } finally {
      setPendingId(null);
    }
  };

  const handleToggleStatus = async (post: BlogPost) => {
    const nextStatus: BlogPostStatus =
      post.status === 'published' ? 'draft' : 'published';
    setPendingId(post.id);
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          published_at:
            nextStatus === 'published'
              ? post.published_at ?? new Date().toISOString()
              : null,
        }),
      });
      if (!res.ok) await parseApiError(res);
      const { post: updated } = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === post.id ? updated : p)));
      showToast(
        nextStatus === 'published' ? '발행되었습니다.' : '초안으로 변경되었습니다.',
        'success',
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : '변경 실패', 'error');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="제목 검색"
              className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
          >
            <option value="all">전체 상태</option>
            <option value="published">발행됨</option>
            <option value="draft">초안</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value as typeof sourceFilter);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
          >
            <option value="all">전체 출처</option>
            <option value="manual">수동 작성</option>
            <option value="auto">자동 생성</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
          >
            <option value="all">전체 카테고리</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          글 작성
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className={cn(ADMIN_TABLE_CLASS, 'min-w-[800px]')}>
            <thead className={ADMIN_TABLE_HEAD_ROW_CLASS}>
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      pagePosts.length > 0 &&
                      pagePosts.every((p) => selected.has(p.id))
                    }
                    onChange={toggleSelectAll}
                    aria-label="전체 선택"
                  />
                </th>
                <th className="px-4 py-3 font-medium">제목</th>
                <th className="px-4 py-3 font-medium">카테고리</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">출처</th>
                <th className="px-4 py-3 font-medium">조회수</th>
                <th className="px-4 py-3 font-medium">작성일</th>
                <th className="px-4 py-3 font-medium">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagePosts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    등록된 글이 없습니다.
                  </td>
                </tr>
              ) : (
                pagePosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(post.id)}
                        onChange={() => toggleSelect(post.id)}
                        aria-label={`${post.title} 선택`}
                      />
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {getBlogCategoryLabel(post.category)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="px-4 py-3">
                      <SourceBadge source={post.source} />
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-600">
                      {post.view_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {formatBlogDateTime(post.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className={ADMIN_TABLE_ACTIONS_CLASS}>
                        <Link
                          href={`/admin/blog/${post.id}`}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                          title="수정"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(post)}
                          disabled={pendingId === post.id}
                          className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                        >
                          {post.status === 'published' ? '초안' : '발행'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(post.id)}
                          disabled={pendingId === post.id}
                          className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="삭제"
                        >
                          {pendingId === post.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleBulkDelete}
          disabled={selected.size === 0 || pendingId === 'bulk'}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
        >
          {pendingId === 'bulk' ? '삭제 중…' : `선택 삭제 (${selected.size})`}
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm',
              page <= 1 ? 'opacity-40' : 'hover:bg-gray-50',
            )}
          >
            이전
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm',
              page >= totalPages ? 'opacity-40' : 'hover:bg-gray-50',
            )}
          >
            다음
          </button>
        </div>
      </div>

      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
