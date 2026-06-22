'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { AuthCard } from '@/components/auth/AuthCard';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import {
  TRACK_LOGIN_EMAIL,
  TRACK_LOGIN_GOOGLE,
} from '@/constants/tracking-classes';
import { getOAuthCallbackErrorMessage } from '@/lib/auth-redirect';
import { createClient } from '@/lib/supabase/client';
import { UI_INPUT_CLASS, uiButtonPrimaryClass } from '@/lib/ui/form';
import { cn } from '@/lib/utils';

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
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          required
          autoComplete="email"
          className={UI_INPUT_CLASS}
        />

        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          required
          minLength={6}
          autoComplete="current-password"
          className={UI_INPUT_CLASS}
        />

        {displayError && (
          <p className="text-sm text-red-600" role="alert">
            {displayError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(uiButtonPrimaryClass(loading), TRACK_LOGIN_EMAIL)}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">또는</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <GoogleAuthButton
        next={next}
        trackingClass={TRACK_LOGIN_GOOGLE}
        onError={(msg) => setError(getErrorMessage(msg))}
      />

      <p className="mt-6 text-center text-sm text-gray-500">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="font-bold text-brand-600 hover:text-brand-700">
          회원가입
        </Link>
      </p>
    </AuthCard>
  );
}
