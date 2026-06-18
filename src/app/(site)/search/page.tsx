import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { AdSlot } from '@/components/ads/AdSlot';
import { SearchResultsSection } from '@/components/search/SearchResultsSection';
import { SearchBar } from '@/components/ui/SearchBar';
import { SkeletonCardGrid } from '@/components/ui/SkeletonCard';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';

  if (!query) {
    redirect('/');
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 max-w-xl">
        <SearchBar defaultValue={query} />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
        &quot;{query}&quot; 검색 결과
      </h1>

      <AdSlot slotKey="HOME_TOP" variant="banner" className="mt-6 w-full" />

      <Suspense fallback={<SkeletonCardGrid count={6} />}>
        <SearchResultsSection query={query} />
      </Suspense>
    </div>
  );
}
