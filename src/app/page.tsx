import { AdSlot } from '@/components/ads/AdSlot';
import { RequestCta } from '@/components/RequestCta';
import { HomeCategoryExplorer } from '@/components/home/HomeCategoryExplorer';
import { MostPopularSection } from '@/components/home/MostPopularSection';
import { WebSiteJsonLd } from '@/components/seo/JsonLd';
import { SearchBar } from '@/components/ui/SearchBar';
import { getPopularToolsByCategory } from '@/lib/featured-tools';
import { localizeCategories } from '@/lib/i18n/content';
import { getLocale, getTranslations } from '@/lib/locale';
import { groupSubCategoriesByCategory } from '@/lib/sub-categories';
import {
  getAllCategories,
  getAllSubCategories,
  getToolCount,
} from '@/lib/supabase/queries';

/** ISR — 1시간마다 재생성 */
export const revalidate = 3600;

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
              <p className="text-4xl font-extrabold uppercase tracking-[0.08em] text-white sm:text-5xl lg:text-6xl">
                FREEHUB
              </p>
              <h1 className="mt-6 text-lg font-medium leading-relaxed text-white sm:text-xl lg:text-2xl">
                {t('home.heroTagline')}
              </h1>
              <p className="mt-3 text-sm text-neutral-400 sm:text-base">
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
              <h2 className="mb-8 text-lg font-bold uppercase tracking-wider text-white sm:text-xl">
                {t('home.categoriesTitle')}
              </h2>
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

        <RequestCta
          title={t('home.requestCtaTitle')}
          description={t('home.requestCtaDescription')}
          buttonLabel={t('home.requestCtaButton')}
        />

        <section className="border-t border-neutral-800 bg-black px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-neutral-400 sm:text-base">
            {t('home.statsPrefix')}{' '}
            <span className="font-medium text-white">
              {t('home.stats', {
                toolCount: toolCount.toLocaleString(numberLocale),
                categoryCount: categories.length.toLocaleString(numberLocale),
              })}
            </span>
          </p>
        </section>
      </div>
    </>
  );
}
