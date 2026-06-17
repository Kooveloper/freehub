'use client';

import { InquiryForm } from '@/components/inquiry/InquiryForm';
import { useLocale } from '@/contexts/LocaleContext';

export function InquiryPageContent() {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {t('inquiry.pageTitle')}
        </h1>
        <p className="mt-2 text-sm text-gray-500">{t('inquiry.pageDescription')}</p>
      </div>

      <InquiryForm />
    </div>
  );
}
