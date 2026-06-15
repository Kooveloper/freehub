import { SearchAnalytics } from '@/components/search/SearchAnalytics';
import { SearchEmptyStateWrapper } from '@/components/search/SearchEmptyStateWrapper';
import { SearchResultsGrid } from '@/components/search/SearchResultsGrid';
import { localizeCategories } from '@/lib/i18n/content';
import { getLocale } from '@/lib/locale';
import { buildSubCategoryNameMap } from '@/lib/sub-categories';
import {
  getAllCategories,
  getAllSubCategories,
  searchTools,
} from '@/lib/supabase/queries';

interface SearchResultsSectionProps {
  query: string;
}

export async function SearchResultsSection({ query }: SearchResultsSectionProps) {
  const locale = await getLocale();
  const [{ tools, total }, categories, subCategories] = await Promise.all([
    searchTools(query),
    getAllCategories(),
    getAllSubCategories(),
  ]);

  const localizedCategories = localizeCategories(categories, locale);
  const categoryMap = Object.fromEntries(
    localizedCategories.map((category) => [category.slug, category]),
  );
  const subCategoryNameMap = buildSubCategoryNameMap(subCategories, locale);

  return (
    <>
      <SearchAnalytics query={query} resultCount={total} />
      <p className="mt-1 text-sm text-gray-500">{total}개</p>
      <div className="mt-8">
        {total === 0 ? (
          <SearchEmptyStateWrapper query={query} />
        ) : (
          <SearchResultsGrid
            tools={tools}
            categoryMap={categoryMap}
            subCategoryNameMap={subCategoryNameMap}
          />
        )}
      </div>
    </>
  );
}
