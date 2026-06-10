'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';

const TITLE_MAX = 50;
const CONTENT_MAX = 300;
const EMAIL_MAX = 100;
const COOLDOWN_MS = 3000;

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

/** 홈페이지 서비스 추가 요청 폼 */
export function RequestForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [cooldown, setCooldown] = useState(false);

  const resetStatus = () => {
    if (status === 'success' || status === 'error') {
      setStatus('idle');
    }
  };

  const handleTitleChange = (value: string) => {
    resetStatus();
    setTitle(value.slice(0, TITLE_MAX));
  };

  const handleContentChange = (value: string) => {
    resetStatus();
    setContent(value.slice(0, CONTENT_MAX));
  };

  const handleEmailChange = (value: string) => {
    resetStatus();
    setEmail(value.slice(0, EMAIL_MAX));
  };

  const isValid =
    title.trim().length > 0 &&
    title.length <= TITLE_MAX &&
    content.trim().length > 0 &&
    content.length <= CONTENT_MAX &&
    email.length <= EMAIL_MAX;

  const isDisabled = status === 'submitting' || cooldown || !isValid;

  const startCooldown = () => {
    setCooldown(true);
    setTimeout(() => setCooldown(false), COOLDOWN_MS);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;

    setStatus('submitting');

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          email: email.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('요청 실패');

      setStatus('success');
      setTitle('');
      setContent('');
      setEmail('');
      startCooldown();
    } catch {
      setStatus('error');
      startCooldown();
    }
  };

  return (
    <div className="rounded-2xl border border-brand-200/60 bg-white p-6 shadow-sm shadow-brand-900/5 sm:p-8">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
          등록되지 않은 서비스가 있나요?
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          알려주시면 검토 후 추가해드릴게요 🙏
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="request-title" className="sr-only">
            서비스명
          </label>
          <input
            id="request-title"
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="서비스명을 입력해주세요"
            maxLength={TITLE_MAX}
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div>
          <label htmlFor="request-content" className="sr-only">
            서비스 설명
          </label>
          <textarea
            id="request-content"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="어떤 서비스인지, 무료로 어떤 기능을 제공하는지 알려주세요"
            maxLength={CONTENT_MAX}
            required
            rows={4}
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {content.length}/{CONTENT_MAX}
          </p>
        </div>

        <div>
          <label htmlFor="request-email" className="sr-only">
            이메일
          </label>
          <input
            id="request-email"
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="답변 받을 이메일 (선택사항)"
            maxLength={EMAIL_MAX}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <button
          type="submit"
          disabled={isDisabled}
          className={cn(
            'w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors',
            isDisabled
              ? 'cursor-not-allowed bg-brand-300'
              : 'bg-brand-600 hover:bg-brand-700',
          )}
        >
          {status === 'submitting' ? '요청 중...' : '요청하기'}
        </button>
      </form>

      {status === 'success' && (
        <p className="mt-4 text-center text-sm font-medium text-green-600">
          요청이 접수되었습니다! 검토 후 반영할게요 😊
        </p>
      )}

      {status === 'error' && (
        <p className="mt-4 text-center text-sm font-medium text-red-600">
          잠시 후 다시 시도해주세요
        </p>
      )}
    </div>
  );
}
