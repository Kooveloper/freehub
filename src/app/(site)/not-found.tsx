import Link from 'next/link';

import { getTranslations } from '@/lib/locale';

export default async function NotFound() {
  const t = await getTranslations();

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium text-brand-600">404</p>
      <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
        {t('notFound.title')}
      </h1>
      <p className="mt-3 max-w-md text-sm text-gray-500">
        {t('notFound.description')}
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        {t('notFound.backHome')}
      </Link>
    </div>
  );
}
