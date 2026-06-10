import { CategoryToolList } from '@/components/category/CategoryToolList';
import { localizeTools } from '@/lib/i18n/content';
import { getLocale } from '@/lib/locale';
import { getToolsByCategory } from '@/lib/supabase/queries';

interface CategoryToolsSectionProps {
  slug: string;
}

export async function CategoryToolsSection({ slug }: CategoryToolsSectionProps) {
  const locale = await getLocale();
  const tools = await getToolsByCategory(slug);
  const localizedTools = localizeTools(tools, locale);

  return <CategoryToolList tools={localizedTools} categorySlug={slug} />;
}
