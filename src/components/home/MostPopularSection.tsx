import { MostPopularCarousel } from '@/components/home/MostPopularCarousel';
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
    <MostPopularCarousel
      title={t('home.mostPopular')}
      subtitle={
        locale === 'en'
          ? 'Top picks by category'
          : '카테고리별로 가장 많이 찾은 서비스'
      }
      entries={localized}
    />
  );
}
