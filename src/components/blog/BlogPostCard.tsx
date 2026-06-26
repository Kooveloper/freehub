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
  variant?: 'grid' | 'carousel';
  className?: string;
}

export function BlogPostCard({
  post,
  variant = 'grid',
  className,
}: BlogPostCardProps) {
  const categoryColor = getBlogCategoryColor(post.category);
  const isCarousel = variant === 'carousel';

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        'group flex flex-col rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
        isCarousel
          ? 'w-[min(calc(100vw-3rem),14rem)] shrink-0 snap-center p-4 sm:w-[15rem]'
          : 'min-w-0 p-5',
        className,
      )}
    >
      {post.category && (
        <span
          className={cn(
            'mb-2 inline-flex w-fit max-w-full truncate rounded-full px-2 py-0.5 text-xs font-medium text-white',
            isCarousel && 'mb-1.5',
          )}
          style={{ backgroundColor: categoryColor }}
        >
          {getBlogCategoryLabel(post.category)}
        </span>
      )}
      <h3
        className={cn(
          'font-bold text-neutral-900 group-hover:text-blue-700',
          isCarousel
            ? 'line-clamp-2 text-sm leading-snug'
            : 'line-clamp-2 text-base',
        )}
      >
        {post.title}
      </h3>
      {post.meta_description && (
        <p
          className={cn(
            'text-neutral-500',
            isCarousel
              ? 'mt-1.5 line-clamp-1 text-xs leading-relaxed'
              : 'mt-2 line-clamp-2 text-sm leading-relaxed',
          )}
        >
          {post.meta_description}
        </p>
      )}
      <div
        className={cn(
          'mt-auto flex items-center gap-2 border-t border-neutral-100 pt-2.5',
          isCarousel ? 'mt-3' : 'mt-4 pt-3',
        )}
      >
        {!isCarousel &&
          (post.tags ?? []).slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
            >
              {tag}
            </span>
          ))}
        <span
          className={cn(
            'text-neutral-400',
            isCarousel ? 'text-[11px]' : 'ml-auto text-xs',
            !isCarousel && (post.tags ?? []).length === 0 && 'ml-0',
            !isCarousel && (post.tags ?? []).length > 0 && 'ml-auto',
          )}
        >
          {formatBlogDate(post.published_at)}
        </span>
      </div>
    </Link>
  );
}
