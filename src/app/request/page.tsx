import type { Metadata } from 'next';

import { RequestForm } from '@/components/RequestForm';
import { getLocale, getTranslations } from '@/lib/locale';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations();

  return {
    title:
      locale === 'en'
        ? 'Request a service | FreeHub'
        : '서비스 추가 요청 | FreeHub',
    description: t('request.description'),
  };
}

export default async function RequestPage() {
  const t = await getTranslations();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-8 text-center sm:mb-10">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {t('request.title')}
        </h1>
        <p className="mt-3 text-sm text-gray-500 sm:text-base">
          {t('request.description')}
        </p>
        <p className="mt-1.5 text-sm text-gray-400">
          {t('request.pageDescription')}
        </p>
      </div>

      <RequestForm />
    </div>
  );
}
