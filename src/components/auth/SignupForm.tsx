'use client';

import Link from 'next/link';
import { useState } from 'react';

import { AuthCard } from '@/components/auth/AuthCard';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import {
  TRACK_SIGNUP_EMAIL,
  TRACK_SIGNUP_GOOGLE,
} from '@/constants/tracking-classes';
import { useLocale } from '@/contexts/LocaleContext';
import { buildAuthCallbackUrl } from '@/lib/auth-redirect';
import {
  isValidSignupPassword,
  SIGNUP_PASSWORD_PLACEHOLDER,
  SIGNUP_PASSWORD_RULE_MESSAGE,
} from '@/lib/password';
import { validateNickname } from '@/lib/nickname';
import { createClient } from '@/lib/supabase/client';
import { UI_INPUT_CLASS, uiButtonPrimaryClass } from '@/lib/ui/form';
import { cn } from '@/lib/utils';

function getErrorMessage(message: string, locale: 'ko' | 'en'): string {
  const mapKo: Record<string, string> = {
    'User already registered': '이미 가입된 이메일입니다.',
    'Password should be at least 6 characters': SIGNUP_PASSWORD_RULE_MESSAGE,
    'Error sending confirmation email':
      '인증 메일 발송에 실패했습니다. 잠시 후 다시 시도하거나 Google 로그인을 이용해주세요.',
    'Email rate limit exceeded':
      '이메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
  };
  const mapEn: Record<string, string> = {
    'User already registered': 'This email is already registered.',
    'Password should be at least 6 characters':
      'Password must be at least 6 characters with letters and numbers.',
    'Error sending confirmation email':
      'Could not send confirmation email. Try again later or use Google sign-in.',
    'Email rate limit exceeded': 'Email rate limit exceeded. Please try again later.',
  };
  const map = locale === 'en' ? mapEn : mapKo;
  return map[message] ?? message;
}

/** 이메일·비밀번호 회원가입 폼 */
export function SignupForm() {
  const { locale, t } = useLocale();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidSignupPassword(password)) {
      setError(
        locale === 'en'
          ? 'Password must be at least 6 characters with letters and numbers.'
          : SIGNUP_PASSWORD_RULE_MESSAGE,
      );
      return;
    }

    const nicknameError = validateNickname(nickname);
    if (nicknameError) {
      setError(nicknameError);
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { locale, nickname: nickname.trim() },
        emailRedirectTo: buildAuthCallbackUrl('/'),
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(getErrorMessage(signUpError.message, locale));
      return;
    }

    setEmailSent(true);
  };

  if (emailSent) {
    return (
      <AuthCard title={t('auth.signupTitle')}>
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">
            {t('auth.emailSentTitle')}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {t('auth.emailSentDescription', { email })}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {t('auth.backToLogin')}
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t('auth.signupTitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('auth.email')}
          required
          autoComplete="email"
          className={UI_INPUT_CLASS}
        />

        <input
          id="signup-nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={t('auth.nickname')}
          required
          minLength={2}
          maxLength={20}
          autoComplete="nickname"
          className={UI_INPUT_CLASS}
        />

        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={SIGNUP_PASSWORD_PLACEHOLDER}
          required
          minLength={6}
          autoComplete="new-password"
          className={UI_INPUT_CLASS}
        />

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(uiButtonPrimaryClass(loading), TRACK_SIGNUP_EMAIL)}
        >
          {loading ? t('auth.signupLoading') : t('auth.signupButton')}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">{t('auth.or')}</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <GoogleAuthButton
        label={t('auth.googleSignup')}
        trackingClass={TRACK_SIGNUP_GOOGLE}
        onError={(msg) => setError(getErrorMessage(msg, locale))}
      />

      <p className="mt-6 text-center text-sm text-gray-500">
        {t('auth.hasAccount')}{' '}
        <Link href="/login" className="font-bold text-brand-600 hover:text-brand-700">
          {t('auth.loginLink')}
        </Link>
      </p>
    </AuthCard>
  );
}
