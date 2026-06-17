'use client';

import { ArrowLeft, Heart, MessageSquare, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Toast, useToast } from '@/components/admin/Toast';
import { Badge } from '@/components/ui/Badge';
import { ToolLogo } from '@/components/ui/ToolLogo';
import type { AdminUser, AdminUserFavorite } from '@/lib/supabase/admin-users';
import type { ToolReview } from '@/types/review';
import { cn } from '@/lib/utils';
import { StarRatingDisplay } from '@/components/tool/StarRating';

interface UserDetailManagerProps {
  user: AdminUser;
  favorites: AdminUserFavorite[];
  reviews: ToolReview[];
}

type DetailTab = 'info' | 'activity';

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

async function parseApiError(response: Response) {
  const data = await response.json().catch(() => ({}));
  throw new Error(
    typeof data.error === 'string' ? data.error : '요청에 실패했습니다.',
  );
}

function formatDateTime(date: string | null) {
  if (!date) return '-';
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

export function UserDetailManager({ user, favorites, reviews }: UserDetailManagerProps) {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (user.email_verified) return;

    const confirmed = window.confirm(
      `${user.email} 회원의 이메일을 수동 인증 처리할까요?`,
    );
    if (!confirmed) return;

    setVerifying(true);
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
      setVerifying(false);
    }
  };

  const handlePasswordSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < 6) {
      showToast('비밀번호는 6자 이상이어야 합니다.', 'error');
      return;
    }
    if (password !== passwordConfirm) {
      showToast('비밀번호 확인이 일치하지 않습니다.', 'error');
      return;
    }

    const confirmed = window.confirm('비밀번호를 변경할까요?');
    if (!confirmed) return;

    setSavingPassword(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) await parseApiError(response);
      setPassword('');
      setPasswordConfirm('');
      showToast('비밀번호가 변경되었습니다.', 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.',
        'error',
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        회원 목록으로
      </Link>

      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={cn(
            'border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
            activeTab === 'info'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          )}
        >
          회원 정보
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={cn(
            'border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
            activeTab === 'activity'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          )}
        >
          활동 내역
        </button>
      </div>

      {activeTab === 'info' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">회원 정보</h2>

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-gray-500">닉네임</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {user.nickname ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">이메일</dt>
                <dd className="mt-1 font-medium text-gray-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-gray-500">가입 방식</dt>
                <dd className="mt-1 text-gray-900">{getProviderLabel(user.provider)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">가입일/시간</dt>
                <dd className="mt-1 text-gray-900">{formatDateTime(user.created_at)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">마지막 로그인</dt>
                <dd className="mt-1 text-gray-900">
                  {formatDateTime(user.last_sign_in_at)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">인증 여부</dt>
                <dd className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={user.email_verified ? 'green' : 'yellow'}>
                    {user.email_verified ? '인증됨' : '미인증'}
                  </Badge>
                  {!user.email_verified && user.provider === 'email' ? (
                    <button
                      type="button"
                      onClick={handleVerify}
                      disabled={verifying}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50',
                        verifying && 'cursor-not-allowed opacity-60',
                      )}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      수동 인증
                    </button>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">회원 ID</dt>
                <dd className="mt-1 break-all font-mono text-xs text-gray-600">
                  {user.id}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">비밀번호 수정</h2>
            <p className="mt-1 text-sm text-gray-500">
              이메일 가입 회원의 비밀번호를 관리자가 직접 변경할 수 있습니다.
            </p>

            {user.provider !== 'email' ? (
              <p className="mt-5 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
                {getProviderLabel(user.provider)} 로그인 회원은 비밀번호 변경이
                지원되지 않습니다.
              </p>
            ) : (
              <form onSubmit={handlePasswordSave} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="admin-user-password"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    새 비밀번호
                  </label>
                  <input
                    id="admin-user-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={6}
                    autoComplete="new-password"
                    className={INPUT_CLASS}
                    placeholder="6자 이상"
                  />
                </div>
                <div>
                  <label
                    htmlFor="admin-user-password-confirm"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    새 비밀번호 확인
                  </label>
                  <input
                    id="admin-user-password-confirm"
                    type="password"
                    value={passwordConfirm}
                    onChange={(event) => setPasswordConfirm(event.target.value)}
                    minLength={6}
                    autoComplete="new-password"
                    className={INPUT_CLASS}
                    placeholder="비밀번호 재입력"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className={cn(
                    'rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors',
                    savingPassword
                      ? 'cursor-not-allowed bg-blue-300'
                      : 'bg-brand-600 hover:bg-brand-700',
                  )}
                >
                  {savingPassword ? '저장 중...' : '비밀번호 변경'}
                </button>
              </form>
            )}
          </section>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-900">작성한 리뷰</h2>
              </div>
              <span className="text-sm text-gray-500">
                {reviews.length.toLocaleString('ko-KR')}개
              </span>
            </div>

            {reviews.length === 0 ? (
              <p className="mt-4 rounded-lg bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                작성한 리뷰가 없습니다.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-gray-100">
                {reviews.map((review) => (
                  <li key={review.id} className="py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StarRatingDisplay value={review.rating} size="sm" />
                      <span className="text-xs text-gray-400">
                        {formatDateTime(review.created_at)}
                      </span>
                    </div>
                    {review.tool_name && review.tool_slug && (
                      <Link
                        href={`/tool/${review.tool_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block text-sm font-medium text-gray-900 hover:text-brand-600"
                      >
                        {review.tool_name}
                      </Link>
                    )}
                    <p className="mt-1 text-sm text-gray-700">{review.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-900">
                  즐겨찾기한 서비스
                </h2>
              </div>
              <span className="text-sm text-gray-500">
                {favorites.length.toLocaleString('ko-KR')}개
              </span>
            </div>

            {favorites.length === 0 ? (
              <p className="mt-4 rounded-lg bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                즐겨찾기한 서비스가 없습니다.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-gray-100">
                {favorites.map(({ tool, favorited_at }) => (
                  <li key={tool.id} className="flex items-center gap-3 py-3">
                    <ToolLogo
                      name={tool.name}
                      logoUrl={tool.logo_url}
                      size={40}
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/tool/${tool.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate font-medium text-gray-900 hover:text-brand-600"
                      >
                        {tool.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {formatDateTime(favorited_at)} 추가
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <Toast toast={toast} onClose={hideToast} />
    </div>
  );
}
