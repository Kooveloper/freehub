import Link from 'next/link';

import {
  formatBlogDate,
  getBlogCategoryColor,
  getBlogCategoryLabel,
} from '@/lib/blog-utils';
import { cn } from '@/lib/utils';
import type { BlogPost } from '@/types/blog';

interface BlogPostCardProps {
  post: BlogPost;
  className?: string;
}

export function BlogPostCard({ post, className }: BlogPostCardProps) {
  const categoryColor = getBlogCategoryColor(post.category);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        'group flex min-w-[280px] shrink-0 snap-start flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
        className,
      )}
    >
      {post.category && (
        <span
          className="mb-3 inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: categoryColor }}
        >
          {getBlogCategoryLabel(post.category)}
        </span>
      )}
      <h3 className="line-clamp-2 flex-1 text-base font-bold text-neutral-900 group-hover:text-blue-700">
        {post.title}
      </h3>
      {post.meta_description && (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-500">
          {post.meta_description}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
        {(post.tags ?? []).slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
          >
            {tag}
          </span>
        ))}
        <span className="ml-auto text-xs text-neutral-400">
          {formatBlogDate(post.published_at)}
        </span>
      </div>
    </Link>
  );
}
