import Link from 'next/link';

import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { HomeSectionTitle } from '@/components/home/HomeSectionTitle';
import { getRecentBlogPosts } from '@/lib/supabase/queries';

export async function HomeBlogSection() {
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
        <HomeSectionTitle title="📝 최신 무료 툴 가이드" />
        <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
          {posts.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/blog"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            블로그 전체 보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}
