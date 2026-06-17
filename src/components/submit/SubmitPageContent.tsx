'use client';

import { Suspense } from 'react';

import { SubmitForm } from '@/components/submit/SubmitForm';
import { useLocale } from '@/contexts/LocaleContext';
import type { ToolOption } from '@/types/submission';

function SubmitFormFallback() {
  const { t } = useLocale();

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-400">
      {t('submit.loading')}
    </div>
  );
}

interface SubmitPageContentProps {
  tools: ToolOption[];
}

export function SubmitPageContent({ tools }: SubmitPageContentProps) {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {t('submit.pageTitle')}
        </h1>
        <p className="mt-2 text-sm text-gray-500">{t('submit.pageDescription')}</p>
      </div>

      <Suspense fallback={<SubmitFormFallback />}>
        <SubmitForm tools={tools} />
      </Suspense>
    </div>
  );
}
