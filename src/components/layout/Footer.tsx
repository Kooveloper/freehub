import Link from 'next/link';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { getTranslations } from '@/lib/locale';

export async function Footer() {
  const t = await getTranslations();

  const footerLinks = [
    { href: '/submit?tab=inquiry', label: t('footer.inquiry') },
    { href: '/privacy', label: t('footer.privacy') },
    { href: '/terms', label: t('footer.terms') },
  ] as const;

  return (
    <footer className="mt-auto border-t border-neutral-800 bg-black text-neutral-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <BrandLogo className="text-white hover:text-neutral-300" />
            <p className="mt-2 text-sm text-neutral-500">{t('footer.tagline')}</p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {footerLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium text-neutral-400 transition-colors hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 border-t border-neutral-800 pt-8 text-center text-xs text-neutral-600">
          © {new Date().getFullYear()} FREEHUB. {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
}
