'use client';

import Link from 'next/link';
import { useId } from 'react';

import { useLocale } from '@/contexts/LocaleContext';
import type { SignupConsentState } from '@/lib/signup-consent';
import { cn } from '@/lib/utils';

interface SignupConsentFieldsProps {
  value: SignupConsentState;
  onChange: (value: SignupConsentState) => void;
  className?: string;
}

function ConsentCheckbox({
  id,
  checked,
  onChange,
  label,
  badge,
  required,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  badge?: string;
  required?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm text-gray-700">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
      />
      <span className="leading-5">
        {badge && (
          <span
            className={cn(
              'mr-1.5 inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold',
              required ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600',
            )}
          >
            {badge}
          </span>
        )}
        {label}
        {children}
      </span>
    </label>
  );
}

/** 회원가입 약관·개인정보·마케팅 동의 체크박스 */
export function SignupConsentFields({
  value,
  onChange,
  className,
}: SignupConsentFieldsProps) {
  const { t } = useLocale();
  const baseId = useId();

  const agreeAll = value.terms && value.privacy && value.marketing;

  const setAgreeAll = (checked: boolean) => {
    onChange({ terms: checked, privacy: checked, marketing: checked });
  };

  const setField = (field: keyof SignupConsentState, checked: boolean) => {
    onChange({ ...value, [field]: checked });
  };

  return (
    <div className={cn('space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4', className)}>
      <ConsentCheckbox
        id={`${baseId}-all`}
        checked={agreeAll}
        onChange={setAgreeAll}
        label={t('auth.consentAgreeAll')}
      />

      <div className="space-y-2.5 border-t border-gray-200 pt-3">
        <ConsentCheckbox
          id={`${baseId}-terms`}
          checked={value.terms}
          onChange={(checked) => setField('terms', checked)}
          badge={t('auth.consentRequired')}
          required
          label={t('auth.consentTerms')}
        >
          {' '}
          <Link
            href="/terms"
            target="_blank"
            className="font-medium text-brand-600 underline-offset-2 hover:underline"
          >
            {t('auth.consentView')}
          </Link>
        </ConsentCheckbox>

        <ConsentCheckbox
          id={`${baseId}-privacy`}
          checked={value.privacy}
          onChange={(checked) => setField('privacy', checked)}
          badge={t('auth.consentRequired')}
          required
          label={t('auth.consentPrivacy')}
        >
          {' '}
          <Link
            href="/privacy"
            target="_blank"
            className="font-medium text-brand-600 underline-offset-2 hover:underline"
          >
            {t('auth.consentView')}
          </Link>
        </ConsentCheckbox>

        <ConsentCheckbox
          id={`${baseId}-marketing`}
          checked={value.marketing}
          onChange={(checked) => setField('marketing', checked)}
          badge={t('auth.consentOptional')}
          label={t('auth.consentMarketing')}
        />
      </div>
    </div>
  );
}
