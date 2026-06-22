'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { AuthCard } from '@/components/auth/AuthCard';
import { SignupConsentFields } from '@/components/auth/SignupConsentFields';
import { useLocale } from '@/contexts/LocaleContext';
import { validateNickname } from '@/lib/nickname';
import {
  buildConsentTimestamps,
  EMPTY_SIGNUP_CONSENT,
  isRequiredConsentComplete,
  type SignupConsentState,
} from '@/lib/signup-consent';
import { UI_INPUT_CLASS, uiButtonPrimaryClass } from '@/lib/ui/form';

/** OAuth 등 프로필 미설정 회원 닉네임·약관 동의 입력 */
export function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const next = searchParams.get('next') ?? '/';
  const [nickname, setNickname] = useState('');
  const [consent, setConsent] = useState<SignupConsentState>(EMPTY_SIGNUP_CONSENT);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const validationError = validateNickname(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!isRequiredConsentComplete(consent)) {
      setError(t('auth.consentRequiredError'));
      return;
    }

    setLoading(true);

    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: nickname.trim(),
        ...buildConsentTimestamps(consent),
      }),
    });

    const json = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(typeof json.error === 'string' ? json.error : t('auth.profileSaveFailed'));
      return;
    }

    router.replace(next.startsWith('/') ? next : '/');
    router.refresh();
  };

  return (
    <AuthCard title={t('auth.completeProfileTitle')}>
      <p className="mb-4 text-sm text-gray-500">{t('auth.completeProfileDescription')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          id="complete-nickname"
          type="text"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder={t('auth.nickname')}
          required
          minLength={2}
          maxLength={20}
          autoComplete="nickname"
          className={UI_INPUT_CLASS}
        />

        <SignupConsentFields value={consent} onChange={setConsent} />

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !isRequiredConsentComplete(consent)}
          className={uiButtonPrimaryClass(loading)}
        >
          {loading ? t('auth.completeProfileSaving') : t('auth.completeProfileSubmit')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/" className="font-medium text-brand-600 hover:text-brand-700">
          {t('auth.backHome')}
        </Link>
      </p>
    </AuthCard>
  );
}
