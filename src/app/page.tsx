import { AdSlot } from '@/components/ads/AdSlot';
import { RequestForm } from '@/components/RequestForm';
import { HomeCategoryExplorer } from '@/components/home/HomeCategoryExplorer';
import { MostPopularSection } from '@/components/home/MostPopularSection';
import { WebSiteJsonLd } from '@/components/seo/JsonLd';
import { SearchBar } from '@/components/ui/SearchBar';
import { getPopularToolsByCategory } from '@/lib/featured-tools';
import { localizeCategories } from '@/lib/i18n/content';
import { getLocale, getTranslations } from '@/lib/locale';
import {
  getAllCategories,
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

  const [categories, toolCount, popularEntries] = await Promise.all([
    getAllCategories(),
    getToolCount(),
    getPopularToolsByCategory(),
  ]);

  const localizedCategories = localizeCategories(categories, locale);

  return (
    <>
      <WebSiteJsonLd
        name={appName}
        url={baseUrl}
        searchUrl={`${baseUrl}/search?q=`}
      />
      <div className="flex flex-col">
        {/* 히어로 + 카테고리 탐색 */}
        <section className="bg-gradient-to-b from-brand-600 via-brand-700 to-brand-950">
          <div className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              aria-hidden
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08) 0%, transparent 40%)',
              }}
            />
            <div className="relative mx-auto max-w-3xl text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                <span className="block">{t('home.heroTitleLine1')}</span>
                <span className="mt-2 block">{t('home.heroTitleLine2')}</span>
              </h1>
              <p className="mt-4 text-base text-white/80 sm:text-lg">
                {t('home.heroSubtitle')}
              </p>
              <div className="mx-auto mt-8 max-w-xl">
                <SearchBar
                  size="lg"
                  placeholder={t('home.searchPlaceholder')}
                  className="shadow-lg shadow-brand-950/20"
                />
              </div>
            </div>
          </div>

          <div className="px-4 pb-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <h2 className="mb-8 text-2xl font-bold text-white">
                {t('home.categoriesTitle')}
              </h2>
              <HomeCategoryExplorer
                categories={localizedCategories}
                variant="dark"
              />
            </div>
          </div>
        </section>

        {/* 인기 서비스 + 광고 (같은 톤 밴드, 광고 off 시 슬롯 자체가 사라짐) */}
        <div className="bg-surface-tint pb-12">
          <MostPopularSection entries={popularEntries} />
          <AdSlot
            slotKey="HOME_TOP"
            variant="banner"
            className="w-full"
            outerClassName="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8"
          />
        </div>

        {/* 서비스 요청 */}
        <section className="border-t border-brand-200/40 bg-surface-muted px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <RequestForm />
          </div>
        </section>

        {/* 통계 */}
        <section className="bg-brand-950 px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-brand-200 sm:text-base">
            {t('home.statsPrefix')}{' '}
            <span className="text-white">
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
