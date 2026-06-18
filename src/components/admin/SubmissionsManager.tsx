'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import {
  ADMIN_TABLE_CLASS,
  ADMIN_TABLE_HEAD_ROW_CLASS,
} from '@/components/admin/admin-table';
import {
  ADMIN_ITEM_STATUSES,
  ADMIN_STATUS_LABELS,
  type AdminItemStatus,
} from '@/constants/admin-status';
import type { AdminSubmission } from '@/lib/supabase/admin-queries';
import { cn } from '@/lib/utils';
import type { SubmissionType } from '@/types/submission';

interface SubmissionsManagerProps {
  submissions: AdminSubmission[];
}

const TYPE_LABELS: Record<SubmissionType, string> = {
  new_tool: '새 서비스',
  limit_change: '한도 변경',
  bug: '버그 신고',
  inquiry: '문의',
};

const STATUS_BADGE: Record<AdminItemStatus, BadgeVariant> = {
  pending: 'yellow',
  reviewing: 'blue',
  done: 'green',
  rejected: 'red',
};

type StatusFilter = 'all' | AdminItemStatus;

const FILTER_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '대기' },
  { value: 'reviewing', label: '검토중' },
  { value: 'done', label: '완료' },
  { value: 'rejected', label: '반려' },
];

async function parseApiError(response: Response) {
  const data = await response.json().catch(() => ({}));
  throw new Error(
    typeof data.error === 'string' ? data.error : '요청에 실패했습니다.',
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function SubmissionsManager({ submissions }: SubmissionsManagerProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return submissions;
    return submissions.filter((item) => item.status === statusFilter);
  }, [submissions, statusFilter]);

  const handleStatusChange = async (id: string, status: AdminItemStatus) => {
    setPendingId(id);
    try {
      const response = await fetch(`/api/admin/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) await parseApiError(response);
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : '상태 변경에 실패했습니다.',
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              statusFilter === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className={cn(ADMIN_TABLE_CLASS, 'min-w-[960px]')}>
            <thead>
              <tr className={ADMIN_TABLE_HEAD_ROW_CLASS}>
                <th className="px-4 py-3 font-medium">유형</th>
                <th className="px-4 py-3 font-medium">제목/서비스명</th>
                <th className="px-4 py-3 font-medium">내용</th>
                <th className="px-4 py-3 font-medium">이메일</th>
                <th className="px-4 py-3 font-medium">접수일</th>
                <th className="px-4 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    {submissions.length === 0
                      ? '접수된 요청이 없습니다.'
                      : '해당 상태의 요청이 없습니다.'}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isPending = pendingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <Badge variant="default">
                          {TYPE_LABELS[item.type]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {item.tool_name ?? '—'}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-gray-700">
                        <p className="line-clamp-2">{item.description}</p>
                        {item.tool_url && (
                          <a
                            href={item.tool_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 block truncate text-xs text-blue-600 hover:underline"
                          >
                            {item.tool_url}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.submitter_email ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="admin-table-actions-wrap">
                          <Badge variant={STATUS_BADGE[item.status]}>
                            {ADMIN_STATUS_LABELS[item.status]}
                          </Badge>
                          <select
                            value={item.status}
                            disabled={isPending}
                            onChange={(event) =>
                              handleStatusChange(
                                item.id,
                                event.target.value as AdminItemStatus,
                              )
                            }
                            className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                            aria-label="상태 변경"
                          >
                            {ADMIN_ITEM_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {ADMIN_STATUS_LABELS[status]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
