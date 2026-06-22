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
import { useLocale } from '@/contexts/LocaleContext';
import { getOAuthCallbackErrorMessage } from '@/lib/auth-redirect';
import { createClient } from '@/lib/supabase/client';
import { UI_INPUT_CLASS, uiButtonPrimaryClass } from '@/lib/ui/form';
import { cn } from '@/lib/utils';

function getErrorMessage(message: string, locale: 'ko' | 'en'): string {
  const mapKo: Record<string, string> = {
    'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'Email not confirmed': '이메일 인증을 완료해주세요.',
  };
  const mapEn: Record<string, string> = {
    'Invalid login credentials': 'Incorrect email or password.',
    'Email not confirmed': 'Please confirm your email first.',
  };
  const map = locale === 'en' ? mapEn : mapKo;
  return map[message] ?? message;
}

/** 이메일·비밀번호 로그인 폼 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, t } = useLocale();
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
      setError(getErrorMessage(signInError.message, locale));
      return;
    }

    router.push(next.startsWith('/') ? next : '/');
    router.refresh();
  };

  return (
    <AuthCard title={t('auth.loginTitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('auth.email')}
          required
          autoComplete="email"
          className={UI_INPUT_CLASS}
        />

        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth.password')}
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
          {loading ? t('auth.loginLoading') : t('auth.loginButton')}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">{t('auth.or')}</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <GoogleAuthButton
        next={next}
        trackingClass={TRACK_LOGIN_GOOGLE}
        onError={(msg) => setError(getErrorMessage(msg, locale))}
      />

      <p className="mt-6 text-center text-sm text-gray-500">
        {t('auth.noAccount')}{' '}
        <Link href="/signup" className="font-bold text-brand-600 hover:text-brand-700">
          {t('auth.signupLink')}
        </Link>
      </p>
    </AuthCard>
  );
}
