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
import type { AdminToolRequest } from '@/lib/supabase/admin-queries';
import { cn } from '@/lib/utils';

interface RequestsManagerProps {
  requests: AdminToolRequest[];
}

const STATUS_BADGE: Record<AdminItemStatus, BadgeVariant> = {
  pending: 'yellow',
  reviewing: 'blue',
  done: 'green',
  rejected: 'red',
};

type StatusFilter = 'all' | AdminItemStatus;

const FILTER_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '전체' },
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

export function RequestsManager({ requests }: RequestsManagerProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [memoDrafts, setMemoDrafts] = useState<Record<string, string>>({});

  const serverMemos = useMemo(
    () =>
      Object.fromEntries(
        requests.map((item) => [item.id, item.admin_memo ?? '']),
      ),
    [requests],
  );

  const mergedMemos = useMemo(
    () => ({ ...serverMemos, ...memoDrafts }),
    [serverMemos, memoDrafts],
  );

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return requests;
    return requests.filter((item) => item.status === statusFilter);
  }, [requests, statusFilter]);

  const handleStatusChange = async (id: string, status: AdminItemStatus) => {
    setPendingId(id);
    try {
      const response = await fetch(`/api/admin/requests/${id}`, {
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

  const handleMemoSave = async (id: string) => {
    const original = requests.find((item) => item.id === id);
    const memo = mergedMemos[id] ?? '';
    if (!original || memo === (original.admin_memo ?? '')) return;

    setPendingId(id);
    try {
      const response = await fetch(`/api/admin/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_memo: memo }),
      });

      if (!response.ok) await parseApiError(response);
      setMemoDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : '메모 저장에 실패했습니다.',
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
          <table className={cn(ADMIN_TABLE_CLASS, 'min-w-[1080px]')}>
            <thead>
              <tr className={ADMIN_TABLE_HEAD_ROW_CLASS}>
                <th className="px-4 py-3 font-medium">제목</th>
                <th className="px-4 py-3 font-medium">내용</th>
                <th className="px-4 py-3 font-medium">이메일</th>
                <th className="px-4 py-3 font-medium">접수일</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">메모</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    {requests.length === 0
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
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {item.title}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-gray-700">
                        <p className="line-clamp-3">{item.content}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.email ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
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
                      <td className="px-4 py-3">
                        <textarea
                          rows={2}
                          value={mergedMemos[item.id] ?? ''}
                          disabled={isPending}
                          onChange={(event) =>
                            setMemoDrafts((prev) => ({
                              ...prev,
                              [item.id]: event.target.value,
                            }))
                          }
                          onBlur={() => handleMemoSave(item.id)}
                          placeholder="내부 메모"
                          className="w-full min-w-[160px] rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                        />
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
