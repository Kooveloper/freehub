'use client';

import { cn } from '@/lib/utils';

import { LOCALE_LABELS, LOCALES, type Locale } from '@/i18n/config';
import { useLocale } from '@/contexts/LocaleContext';

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className={cn(
        'inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5',
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setLocale(value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
            locale === value
              ? 'bg-white text-brand-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700',
          )}
          aria-pressed={locale === value}
        >
          {LOCALE_LABELS[value]}
        </button>
      ))}
    </div>
  );
}
