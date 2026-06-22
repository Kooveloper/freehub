'use client';

import { useLocale } from '@/contexts/LocaleContext';

export default function Error({
  error: _error,
  reset: _reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium text-red-600">{t('errorPage.label')}</p>
      <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
        {t('errorPage.title')}
      </h1>
      <p className="mt-3 max-w-md text-sm text-gray-500">
        {t('errorPage.description')}
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-8 inline-flex items-center rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        {t('errorPage.reload')}
      </button>
    </div>
  );
}
