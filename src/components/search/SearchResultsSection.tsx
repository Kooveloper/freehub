import { SearchAnalytics } from '@/components/search/SearchAnalytics';
import { SearchEmptyStateWrapper } from '@/components/search/SearchEmptyStateWrapper';
import { SearchResultsGrid } from '@/components/search/SearchResultsGrid';
import { searchTools } from '@/lib/supabase/queries';

interface SearchResultsSectionProps {
  query: string;
}

export async function SearchResultsSection({ query }: SearchResultsSectionProps) {
  const { tools, total } = await searchTools(query);

  return (
    <>
      <SearchAnalytics query={query} resultCount={total} />
      <p className="mt-1 text-sm text-gray-500">{total}개</p>
      <div className="mt-8">
        {total === 0 ? (
          <SearchEmptyStateWrapper query={query} />
        ) : (
          <SearchResultsGrid tools={tools} />
        )}
      </div>
    </>
  );
}
