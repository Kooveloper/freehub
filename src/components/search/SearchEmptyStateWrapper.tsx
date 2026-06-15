import { SearchEmptyState } from '@/components/search/SearchEmptyState';
import { localizeCategories } from '@/lib/i18n/content';
import { getLocale } from '@/lib/locale';
import {
  groupSubCategoriesByCategory,
  localizeSubCategories,
  previewSubCategories,
} from '@/lib/sub-categories';
import {
  getAllCategories,
  getAllSubCategories,
  getCategoryToolCounts,
  getEditorPicks,
} from '@/lib/supabase/queries';

interface SearchEmptyStateWrapperProps {
  query: string;
}

export async function SearchEmptyStateWrapper({
  query,
}: SearchEmptyStateWrapperProps) {
  const locale = await getLocale();
  const [categories, subCategories, popularTools, categoryToolCounts] =
    await Promise.all([
      getAllCategories(),
      getAllSubCategories(),
      getEditorPicks(6),
      getCategoryToolCounts(),
    ]);

  const localizedCategories = localizeCategories(categories, locale);
  const localizedSubCategories = localizeSubCategories(subCategories, locale);
  const subByCategory = groupSubCategoriesByCategory(localizedSubCategories);

  return (
    <SearchEmptyState
      query={query}
      categories={localizedCategories}
      popularTools={popularTools}
      categoryToolCounts={categoryToolCounts}
      subByCategory={subByCategory}
    />
  );
}
