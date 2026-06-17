'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { AuthCard } from '@/components/auth/AuthCard';
import { validateNickname } from '@/lib/nickname';
import { UI_INPUT_CLASS, uiButtonPrimaryClass } from '@/lib/ui/form';

/** OAuth 등 프로필 미설정 회원 닉네임 입력 */
export function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';
  const [nickname, setNickname] = useState('');
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

    setLoading(true);

    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: nickname.trim() }),
    });

    const json = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(typeof json.error === 'string' ? json.error : '저장에 실패했습니다.');
      return;
    }

    router.replace(next.startsWith('/') ? next : '/');
    router.refresh();
  };

  return (
    <AuthCard title="닉네임 설정">
      <p className="mb-4 text-sm text-gray-500">
        리뷰 작성과 커뮤니티 활동에 사용될 닉네임을 입력해 주세요.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          id="complete-nickname"
          type="text"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="닉네임 (2~20자)"
          required
          minLength={2}
          maxLength={20}
          autoComplete="nickname"
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
          className={uiButtonPrimaryClass(loading)}
        >
          {loading ? '저장 중...' : '시작하기'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/" className="font-medium text-brand-600 hover:text-brand-700">
          홈으로
        </Link>
      </p>
    </AuthCard>
  );
}
