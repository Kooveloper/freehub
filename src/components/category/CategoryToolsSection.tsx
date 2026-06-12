import { CategoryToolList } from '@/components/category/CategoryToolList';
import { localizeTools } from '@/lib/i18n/content';
import { getLocale } from '@/lib/locale';
import { buildSubCategoryNameMap } from '@/lib/sub-categories';
import {
  getSubCategoriesByCategory,
  getToolsByCategory,
} from '@/lib/supabase/queries';
import type { Category } from '@/types/tool';

interface CategoryToolsSectionProps {
  slug: string;
  category: Pick<Category, 'name' | 'icon'>;
}

export async function CategoryToolsSection({
  slug,
  category,
}: CategoryToolsSectionProps) {
  const locale = await getLocale();
  const [tools, subCategories] = await Promise.all([
    getToolsByCategory(slug),
    getSubCategoriesByCategory(slug),
  ]);
  const localizedTools = localizeTools(tools, locale);
  const subCategoryNameMap = buildSubCategoryNameMap(subCategories);

  return (
    <CategoryToolList
      tools={localizedTools}
      categorySlug={slug}
      categoryName={category.name}
      categoryIcon={category.icon}
      subCategoryNameMap={subCategoryNameMap}
    />
  );
}
