'use client';

import { useEffect, useState } from 'react';

import {
  UI_INPUT_CLASS,
  UI_TEXTAREA_CLASS,
  uiButtonPrimaryClass,
} from '@/lib/ui/form';
import { cn } from '@/lib/utils';

const EMAIL_MAX = 100;
const COOLDOWN_MS = 3000;

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

/** 문의하기 폼 */
export function InquiryForm() {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [cooldown, setCooldown] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [email, setEmail] = useState('');

  const isValid =
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    email.trim().length > 0;

  const isDisabled = status === 'submitting' || cooldown || !isValid;

  const resetStatus = () => {
    if (status === 'success' || status === 'error') setStatus('idle');
  };

  const startCooldown = () => {
    setCooldown(true);
    setTimeout(() => setCooldown(false), COOLDOWN_MS);
  };

  useEffect(() => {
    if (!showSuccessToast) return;
    const timer = window.setTimeout(() => setShowSuccessToast(false), 4000);
    return () => window.clearTimeout(timer);
  }, [showSuccessToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;

    setStatus('submitting');

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'inquiry',
          email: email.trim(),
          payload: {
            title: title.trim(),
            content: content.trim(),
          },
        }),
      });

      if (!res.ok) throw new Error('문의 접수 실패');

      setStatus('success');
      setShowSuccessToast(true);
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
    <>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4 p-6 sm:p-8">
          <Field label="제목" required>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                resetStatus();
                setTitle(e.target.value);
              }}
              placeholder="문의 제목을 입력해주세요"
              maxLength={120}
              required
              className={UI_INPUT_CLASS}
            />
          </Field>
          <Field label="내용" required>
            <textarea
              value={content}
              onChange={(e) => {
                resetStatus();
                setContent(e.target.value);
              }}
              placeholder="문의 내용을 자세히 입력해주세요"
              maxLength={2000}
              required
              rows={5}
              className={cn(UI_TEXTAREA_CLASS, 'resize-none')}
            />
          </Field>
          <Field label="답변 받을 이메일" required>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                resetStatus();
                setEmail(e.target.value.slice(0, EMAIL_MAX));
              }}
              placeholder="you@example.com"
              maxLength={EMAIL_MAX}
              required
              className={UI_INPUT_CLASS}
            />
          </Field>

          <button
            type="submit"
            disabled={isDisabled}
            className={uiButtonPrimaryClass(isDisabled)}
          >
            {status === 'submitting' ? '제출 중...' : '문의하기'}
          </button>

          {status === 'error' && (
            <p className="text-center text-sm font-medium text-red-600">
              잠시 후 다시 시도해주세요
            </p>
          )}
        </form>
      </div>

      {showSuccessToast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,24rem)] -translate-x-1/2 rounded-xl border border-green-200 bg-white px-4 py-3 shadow-lg"
        >
          <p className="text-sm font-semibold text-gray-900">
            문의가 접수되었습니다
          </p>
          <p className="mt-1 text-xs text-gray-500">
            검토 후 답변드릴게요. 감사합니다!
          </p>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}
