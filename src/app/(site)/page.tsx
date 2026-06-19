import type { Metadata } from 'next';

import { AdSlot } from '@/components/ads/AdSlot';
import { HomeBlogSection } from '@/components/home/HomeBlogSection';
import { HomeCategoryExplorer } from '@/components/home/HomeCategoryExplorer';
import { HomeSectionTitle } from '@/components/home/HomeSectionTitle';
import { MostPopularSection } from '@/components/home/MostPopularSection';
import { RequestCta } from '@/components/RequestCta';
import { WebSiteJsonLd } from '@/components/seo/JsonLd';
import { SearchBar } from '@/components/ui/SearchBar';
import { getPopularToolsByCategory } from '@/lib/featured-tools';
import { localizeCategories } from '@/lib/i18n/content';
import { getLocale, getTranslations } from '@/lib/locale';
import { buildHomeMetadata } from '@/lib/seo/metadata';
import { groupSubCategoriesByCategory } from '@/lib/sub-categories';
import {
  getAllCategories,
  getAllSubCategories,
  getToolCount,
} from '@/lib/supabase/queries';

/** ISR — 1시간마다 재생성 */
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return buildHomeMetadata(locale);
}

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://freehub.kr';
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'FreeHub';
  const numberLocale = locale === 'en' ? 'en-US' : 'ko-KR';

  const [categories, subCategories, toolCount, popularEntries] =
    await Promise.all([
      getAllCategories(),
      getAllSubCategories(),
      getToolCount(),
      getPopularToolsByCategory(),
    ]);

  const localizedCategories = localizeCategories(categories, locale);
  const subByCategory = groupSubCategoriesByCategory(subCategories);

  return (
    <>
      <WebSiteJsonLd
        name={appName}
        url={baseUrl}
        searchUrl={`${baseUrl}/search?q=`}
      />
      <div className="flex flex-col">
        {/* 히어로 + 카테고리 — OG 이미지 톤 (순수 블랙) */}
        <section className="bg-black text-white">
          <div className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-2xl font-bold leading-snug text-white sm:text-3xl lg:text-4xl lg:leading-tight">
                <span className="block">{t('home.heroTitleLine1')}</span>
                <span className="mt-1 block">{t('home.heroTitleLine2')}</span>
              </h1>
              <p className="mt-4 text-base font-normal leading-relaxed text-neutral-300 sm:text-lg">
                {t('home.heroSubtitle')}
              </p>
              <div className="mx-auto mt-10 max-w-xl">
                <SearchBar
                  size="lg"
                  placeholder={t('home.searchPlaceholder')}
                  variant="dark"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 px-4 pb-14 pt-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <HomeSectionTitle
                dark
                title={t('home.categoriesTitle')}
              />
              <HomeCategoryExplorer
                categories={localizedCategories}
                subByCategory={subByCategory}
                variant="dark"
              />
            </div>
          </div>
        </section>

        <div className="bg-neutral-50 pb-12">
          <MostPopularSection entries={popularEntries} />
          <AdSlot
            slotKey="HOME_TOP"
            variant="banner"
            className="w-full"
            outerClassName="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8"
          />
        </div>

        <HomeBlogSection />

        <RequestCta
          title={t('home.requestCtaTitle')}
          description={t('home.requestCtaDescription')}
          buttonLabel={t('home.requestCtaButton')}
        />

        <section className="border-t border-neutral-800 bg-black px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-white sm:text-sm">
            {t('home.statsPrefix')}{' '}
            {t('home.stats', {
              toolCount: toolCount.toLocaleString(numberLocale),
              categoryCount: categories.length.toLocaleString(numberLocale),
            })}
          </p>
        </section>
      </div>
    </>
  );
}
