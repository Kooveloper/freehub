import Link from 'next/link';

import { CategoryIcon } from '@/components/category/CategoryIcon';
import { ToolLogo } from '@/components/ui/ToolLogo';
import { localizeCategories, localizeTools } from '@/lib/i18n/content';
import type { CategoryFeaturedEntry } from '@/lib/featured-tools';
import { getLocale, getTranslations } from '@/lib/locale';

interface MostPopularSectionProps {
  entries: CategoryFeaturedEntry[];
}

export async function MostPopularSection({ entries }: MostPopularSectionProps) {
  const locale = await getLocale();
  const t = await getTranslations();

  const localized = entries.map((entry) => ({
    category: localizeCategories([entry.category], locale)[0],
    tools: localizeTools(entry.tools, locale),
  }));

  return (
    <section className="px-4 pb-2 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-2 text-2xl font-bold text-brand-900">
          {t('home.mostPopular')}
        </h2>
        <p className="mb-8 text-sm text-brand-600/80">
          {locale === 'en'
            ? 'Top picks by category'
            : '카테고리별로 가장 많이 찾은 서비스'}
        </p>

        <div className="space-y-10">
          {localized.map(({ category, tools }) => {
            if (tools.length === 0) return null;

            return (
              <div
                key={category.slug}
                className="rounded-2xl border border-brand-200/50 bg-white/70 p-5 shadow-sm backdrop-blur-sm sm:p-6"
              >
                <div className="mb-5 flex items-center gap-2.5">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50"
                    style={{ color: category.color }}
                  >
                    <CategoryIcon name={category.icon} size={20} />
                  </span>
                  <h3 className="text-sm font-bold text-brand-800">
                    {category.name}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-5 sm:gap-6">
                  {tools.map((tool, index) => (
                    <Link
                      key={tool.id}
                      href={`/tool/${tool.slug}`}
                      className="group flex w-[72px] flex-col items-center gap-2 sm:w-20"
                    >
                      <div className="relative">
                        <ToolLogo
                          name={tool.name}
                          logoUrl={tool.logo_url}
                          size={56}
                          className="rounded-2xl shadow-sm ring-1 ring-brand-200/80 transition-all group-hover:ring-brand-400/60 group-hover:shadow-md"
                        />
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white shadow-sm">
                          {index + 1}
                        </span>
                      </div>
                      <span className="line-clamp-2 text-center text-xs font-semibold text-brand-900/90 transition-colors group-hover:text-brand-600">
                        {tool.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
