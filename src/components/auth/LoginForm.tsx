'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { AuthCard } from '@/components/auth/AuthCard';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { getOAuthCallbackErrorMessage } from '@/lib/auth-redirect';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

function getErrorMessage(message: string): string {
  const map: Record<string, string> = {
    'Invalid login credentials':
      '이메일 또는 비밀번호가 올바르지 않습니다.',
    'Email not confirmed': '이메일 인증을 완료해주세요.',
  };
  return map[message] ?? message;
}

/** 이메일·비밀번호 로그인 폼 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';

  const callbackError = getOAuthCallbackErrorMessage(
    searchParams.get('error'),
    searchParams.get('error_code'),
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const displayError = error || callbackError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(getErrorMessage(signInError.message));
      return;
    }

    router.push(next.startsWith('/') ? next : '/');
    router.refresh();
  };

  return (
    <AuthCard title="로그인">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-gray-700">
            이메일
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-gray-700">
            비밀번호
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            required
            minLength={6}
            autoComplete="current-password"
            className={INPUT_CLASS}
          />
        </div>

        {displayError && (
          <p className="text-sm text-red-600" role="alert">
            {displayError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors',
            loading
              ? 'cursor-not-allowed bg-blue-300'
              : 'bg-brand-600 hover:bg-brand-700',
          )}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">또는</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <GoogleAuthButton next={next} onError={(msg) => setError(getErrorMessage(msg))} />

      <p className="mt-6 text-center text-sm text-gray-500">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="font-medium text-brand-600 hover:text-brand-700">
          회원가입
        </Link>
      </p>
    </AuthCard>
  );
}
