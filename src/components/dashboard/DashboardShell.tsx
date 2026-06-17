'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard/favorites', labelKey: 'dashboard.favorites' as const },
  { href: '/dashboard/profile', labelKey: 'dashboard.profile' as const },
  { href: '/dashboard/reviews', labelKey: 'dashboard.myReviews' as const },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {t('dashboard.title')}
        </h1>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <nav className="flex shrink-0 gap-2 overflow-x-auto border-b border-gray-200 pb-1 lg:w-52 lg:flex-col lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
          {NAV_ITEMS.map(({ href, labelKey }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )}
              >
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
