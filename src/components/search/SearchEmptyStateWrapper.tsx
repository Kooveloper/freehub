import { SearchEmptyState } from '@/components/search/SearchEmptyState';
import {
  getAllCategories,
  getCategoryToolCounts,
  getEditorPicks,
} from '@/lib/supabase/queries';

interface SearchEmptyStateWrapperProps {
  query: string;
}

export async function SearchEmptyStateWrapper({
  query,
}: SearchEmptyStateWrapperProps) {
  const [categories, popularTools, categoryToolCounts] = await Promise.all([
    getAllCategories(),
    getEditorPicks(6),
    getCategoryToolCounts(),
  ]);

  return (
    <SearchEmptyState
      query={query}
      categories={categories}
      popularTools={popularTools}
      categoryToolCounts={categoryToolCounts}
    />
  );
}
