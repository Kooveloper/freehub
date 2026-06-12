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
        'inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5',
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
              ? 'bg-white text-black shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800',
          )}
          aria-pressed={locale === value}
        >
          {LOCALE_LABELS[value]}
        </button>
      ))}
    </div>
  );
}
