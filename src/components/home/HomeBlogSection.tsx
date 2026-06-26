import Link from 'next/link';

import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { HomeSectionTitle } from '@/components/home/HomeSectionTitle';
import { getTranslations } from '@/lib/locale';
import { getRecentBlogPosts } from '@/lib/supabase/queries';

export async function HomeBlogSection() {
  const t = await getTranslations();
  let posts: Awaited<ReturnType<typeof getRecentBlogPosts>> = [];
  try {
    posts = await getRecentBlogPosts(6);
  } catch {
    return null;
  }

  if (posts.length === 0) return null;

  return (
    <section className="border-t border-neutral-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <HomeSectionTitle title={t('blog.homeSectionTitle')} />
        <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 sm:-mx-6 sm:gap-4 sm:px-6 lg:-mx-8 lg:px-8">
          {posts.map((post) => (
            <BlogPostCard key={post.id} post={post} variant="carousel" />
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/blog"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            {t('blog.viewAll')}
          </Link>
        </div>
      </div>
    </section>
  );
}
