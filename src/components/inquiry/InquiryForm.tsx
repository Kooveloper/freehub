'use client';

import { useEffect, useState } from 'react';

import { useLocale } from '@/contexts/LocaleContext';
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
  const { t } = useLocale();
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

      if (!res.ok) throw new Error('inquiry failed');

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
          <Field label={t('inquiry.title')} required>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                resetStatus();
                setTitle(e.target.value);
              }}
              placeholder={t('inquiry.titlePlaceholder')}
              maxLength={120}
              required
              className={UI_INPUT_CLASS}
            />
          </Field>
          <Field label={t('inquiry.content')} required>
            <textarea
              value={content}
              onChange={(e) => {
                resetStatus();
                setContent(e.target.value);
              }}
              placeholder={t('inquiry.contentPlaceholder')}
              maxLength={2000}
              required
              rows={5}
              className={cn(UI_TEXTAREA_CLASS, 'resize-none')}
            />
          </Field>
          <Field label={t('inquiry.email')} required>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                resetStatus();
                setEmail(e.target.value.slice(0, EMAIL_MAX));
              }}
              placeholder={t('inquiry.emailPlaceholder')}
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
            {status === 'submitting'
              ? t('inquiry.submitting')
              : t('inquiry.submitButton')}
          </button>

          {status === 'error' && (
            <p className="text-center text-sm font-medium text-red-600">
              {t('inquiry.error')}
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
            {t('inquiry.successTitle')}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {t('inquiry.successDescription')}
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
