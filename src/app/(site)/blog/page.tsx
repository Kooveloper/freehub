import type { Metadata } from 'next';
import Link from 'next/link';

import { AdSlot } from '@/components/ads/AdSlot';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { localizeCategories } from '@/lib/i18n/content';
import { getLocale, getTranslations } from '@/lib/locale';
import { buildBlogListMetadata } from '@/lib/seo/metadata';
import { getAllBlogPosts, getAllCategories } from '@/lib/supabase/queries';
import { cn } from '@/lib/utils';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return buildBlogListMetadata(locale);
}

const PAGE_SIZE = 12;

interface BlogListPageProps {
  searchParams: Promise<{ category?: string; page?: string }>;
}

export default async function BlogListPage({ searchParams }: BlogListPageProps) {
  const locale = await getLocale();
  const t = await getTranslations();
  const { category, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  let allPosts: Awaited<ReturnType<typeof getAllBlogPosts>> = [];
  let categories: Awaited<ReturnType<typeof getAllCategories>> = [];
  try {
    [allPosts, categories] = await Promise.all([
      getAllBlogPosts(),
      getAllCategories(),
    ]);
  } catch {
    allPosts = [];
    categories = [];
  }

  const filtered = category
    ? allPosts.filter((p) => p.category === category)
    : allPosts;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const posts = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const localizedFilterCategories = localizeCategories(
    categories.slice(0, 8),
    locale,
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <section className="bg-gradient-to-b from-blue-50 to-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
            {t('blog.title')}
          </h1>
          <p className="mt-3 text-base text-neutral-600 sm:text-lg">
            {t('blog.subtitle')}
          </p>
        </div>
      </section>

      <AdSlot
        slotKey="HOME_TOP"
        variant="banner"
        className="w-full"
        outerClassName="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="scrollbar-hide -mx-4 mb-8 flex gap-2 overflow-x-auto px-4">
          <Link
            href="/blog"
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition',
              !category
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50',
            )}
          >
            {t('blog.all')}
          </Link>
          {localizedFilterCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/blog?category=${cat.slug}`}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition',
                category === cat.slug
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50',
              )}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {posts.length === 0 ? (
          <p className="py-20 text-center text-neutral-500">
            {t('blog.empty')}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} className="min-w-0" />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const params = new URLSearchParams();
              if (category) params.set('category', category);
              if (p > 1) params.set('page', String(p));
              const href = params.toString() ? `/blog?${params}` : '/blog';
              return (
                <Link
                  key={p}
                  href={href}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium',
                    p === currentPage
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50',
                  )}
                >
                  {p}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
