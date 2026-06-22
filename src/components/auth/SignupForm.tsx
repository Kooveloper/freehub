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

function getErrorMessage(message: string): string {
  const map: Record<string, string> = {
    'User already registered': '이미 가입된 이메일입니다.',
    'Password should be at least 6 characters': SIGNUP_PASSWORD_RULE_MESSAGE,
    'Error sending confirmation email':
      '인증 메일 발송에 실패했습니다. 잠시 후 다시 시도하거나 Google 로그인을 이용해주세요.',
    'Email rate limit exceeded':
      '이메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
  };
  return map[message] ?? message;
}

/** 이메일·비밀번호 회원가입 폼 */
export function SignupForm() {
  const { locale } = useLocale();
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
      setError(SIGNUP_PASSWORD_RULE_MESSAGE);
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
      setError(getErrorMessage(signUpError.message));
      return;
    }

    setEmailSent(true);
  };

  if (emailSent) {
    return (
      <AuthCard title="회원가입">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">
            가입 확인 이메일을 보냈어요 📧
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {email}로 발송된 링크를 클릭하면 가입이 완료됩니다.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="회원가입">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          required
          autoComplete="email"
          className={UI_INPUT_CLASS}
        />

        <input
          id="signup-nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임 (2~20자)"
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
          {loading ? '가입 중...' : '회원가입'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">또는</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <GoogleAuthButton
        label="Google로 가입하기"
        trackingClass={TRACK_SIGNUP_GOOGLE}
        onError={(msg) => setError(getErrorMessage(msg))}
      />

      <p className="mt-6 text-center text-sm text-gray-500">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="font-bold text-brand-600 hover:text-brand-700">
          로그인
        </Link>
      </p>
    </AuthCard>
  );
}
