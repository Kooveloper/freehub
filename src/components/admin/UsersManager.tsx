'use client';

import { CheckCircle2, Pencil, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Toast, useToast } from '@/components/admin/Toast';
import { Badge } from '@/components/ui/Badge';
import type { AdminUser } from '@/lib/supabase/admin-users';
import { cn } from '@/lib/utils';

interface UsersManagerProps {
  users: AdminUser[];
}

async function parseApiError(response: Response) {
  const data = await response.json().catch(() => ({}));
  throw new Error(
    typeof data.error === 'string' ? data.error : '요청에 실패했습니다.',
  );
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

function getProviderLabel(provider: string) {
  if (provider === 'google') return 'Google';
  if (provider === 'email') return '이메일';
  return provider;
}

export function UsersManager({ users }: UsersManagerProps) {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [search, setSearch] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(query) ||
        (user.nickname?.toLowerCase().includes(query) ?? false),
    );
  }, [users, search]);

  const handleVerify = async (user: AdminUser) => {
    if (user.email_verified) return;

    const confirmed = window.confirm(
      `${user.email} 회원의 이메일을 수동 인증 처리할까요?`,
    );
    if (!confirmed) return;

    setPendingId(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify' }),
      });

      if (!response.ok) await parseApiError(response);
      showToast('이메일 인증이 완료되었습니다.', 'success');
      router.refresh();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : '인증 처리에 실패했습니다.',
        'error',
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          총 {users.length.toLocaleString('ko-KR')}명
          {search.trim() ? ` · 검색 결과 ${filtered.length.toLocaleString('ko-KR')}명` : ''}
        </p>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="이메일·닉네임 검색"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:max-w-xs"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="w-14 px-4 py-3 font-medium">No.</th>
                <th className="px-4 py-3 font-medium">가입일/시간</th>
                <th className="px-4 py-3 font-medium">닉네임</th>
                <th className="px-4 py-3 font-medium">이메일 (아이디)</th>
                <th className="px-4 py-3 font-medium">인증여부</th>
                <th className="w-28 px-4 py-3 font-medium">수정</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    {search.trim() ? '검색 결과가 없습니다.' : '가입한 회원이 없습니다.'}
                  </td>
                </tr>
              ) : (
                filtered.map((user, index) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="px-4 py-3 text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {formatDateTime(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {user.nickname ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{user.email}</div>
                      <div className="mt-0.5 text-xs text-gray-400">
                        {getProviderLabel(user.provider)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={user.email_verified ? 'green' : 'yellow'}>
                          {user.email_verified ? '인증됨' : '미인증'}
                        </Badge>
                        {!user.email_verified && user.provider === 'email' ? (
                          <button
                            type="button"
                            onClick={() => handleVerify(user)}
                            disabled={pendingId === user.id}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50',
                              pendingId === user.id && 'cursor-not-allowed opacity-60',
                            )}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            수동 인증
                          </button>
                        ) : user.email_verified ? (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            완료
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        수정
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Toast toast={toast} onClose={hideToast} />
    </div>
  );
}
