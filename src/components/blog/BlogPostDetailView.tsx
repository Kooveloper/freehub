import Link from 'next/link';

import { AdSidebar } from '@/components/ads/AdSidebar';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { BlogViewTracker } from '@/components/blog/BlogViewTracker';
import { BlogPostingJsonLd } from '@/components/seo/JsonLd';
import {
  formatBlogDate,
  getBlogCategoryColor,
  getBlogCategoryLabel,
} from '@/lib/blog-utils';
import {
  getBlogPostsByCategory,
  getRecentBlogPosts,
} from '@/lib/supabase/queries';
import type { BlogPost } from '@/types/blog';

const PROSE_CLASS =
  'prose prose-lg max-w-none prose-headings:text-slate-800 prose-headings:font-bold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-800 prose-table:w-full prose-table:border-collapse prose-th:bg-slate-100 prose-th:p-3 prose-th:text-left prose-td:p-3 prose-td:border prose-td:border-slate-200 prose-img:rounded-lg';

interface BlogPostDetailViewProps {
  post: BlogPost;
  trackViews?: boolean;
}

export async function BlogPostDetailView({
  post,
  trackViews = true,
}: BlogPostDetailViewProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://freehub.kr';
  const categoryLabel = getBlogCategoryLabel(post.category);
  const categoryColor = getBlogCategoryColor(post.category);

  let relatedPosts: BlogPost[] = [];
  let recentPosts: BlogPost[] = [];

  if (post.status === 'published') {
    try {
      if (post.category) {
        relatedPosts = (await getBlogPostsByCategory(post.category))
          .filter((p) => p.id !== post.id)
          .slice(0, 3);
      }
      recentPosts = (await getRecentBlogPosts(5)).filter((p) => p.id !== post.id);
    } catch {
      // optional sections
    }
  }

  const categoryHref = post.category ? `/category/${post.category}` : '/';

  return (
    <>
      {post.status === 'published' && (
        <BlogPostingJsonLd
          title={post.title}
          description={post.meta_description ?? post.title}
          url={`${baseUrl}/blog/${post.slug}`}
          datePublished={post.published_at ?? post.created_at}
          dateModified={post.updated_at}
        />
      )}
      {trackViews && post.status === 'published' && (
        <BlogViewTracker postId={post.id} />
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <article className="min-w-0 flex-1">
            <nav className="mb-6 text-sm text-neutral-500">
              <Link href="/" className="hover:text-neutral-800">
                홈
              </Link>
              <span className="mx-2">›</span>
              <Link href="/blog" className="hover:text-neutral-800">
                블로그
              </Link>
              <span className="mx-2">›</span>
              <span className="text-neutral-800">{post.title}</span>
            </nav>

            <div className="mb-4 flex flex-wrap items-center gap-3">
              {post.category && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: categoryColor }}
                >
                  {categoryLabel}
                </span>
              )}
              <time
                dateTime={post.published_at ?? post.created_at}
                className="text-sm text-neutral-500"
              >
                {formatBlogDate(post.published_at ?? post.created_at)}
              </time>
            </div>

            <h1 className="text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl">
              {post.title}
            </h1>

            {(post.tags ?? []).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(post.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <hr className="my-8 border-neutral-200" />

            <div
              className={PROSE_CLASS}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {(post.tags ?? []).length > 0 && (
              <div className="mt-10 border-t border-neutral-200 pt-6">
                <p className="mb-2 text-sm font-semibold text-neutral-700">태그</p>
                <div className="flex flex-wrap gap-2">
                  {(post.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {relatedPosts.length > 0 && (
              <section className="mt-12">
                <h2 className="mb-4 text-xl font-bold text-neutral-900">
                  관련 글
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  {relatedPosts.map((related) => (
                    <BlogPostCard
                      key={related.id}
                      post={related}
                      className="min-w-0"
                    />
                  ))}
                </div>
              </section>
            )}
          </article>

          <aside className="w-full shrink-0 space-y-6 lg:w-72">
            <div className="sticky top-24 space-y-6">
              {post.category && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                  <p className="mb-3 text-sm font-bold text-neutral-900">
                    🔍 무료 툴 바로 찾기
                  </p>
                  <Link
                    href={categoryHref}
                    className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    무료 {categoryLabel} 툴 보러가기 →
                  </Link>
                </div>
              )}

              <AdSidebar />

              {recentPosts.length > 0 && (
                <div className="rounded-xl border border-neutral-200 bg-white p-4">
                  <h3 className="mb-3 text-sm font-bold text-neutral-900">
                    최근 글
                  </h3>
                  <ul className="space-y-3">
                    {recentPosts.map((recent) => (
                      <li key={recent.id}>
                        <Link
                          href={`/blog/${recent.slug}`}
                          className="line-clamp-2 text-sm font-medium text-neutral-800 hover:text-blue-600"
                        >
                          {recent.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-neutral-400">
                          {formatBlogDate(recent.published_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
