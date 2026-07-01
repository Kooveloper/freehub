'use client';

import { AdBlogMid } from '@/components/ads/AdBlogMid';
import type { BlogContentSplit } from '@/lib/blog/split-content-for-ad';
import { cn } from '@/lib/utils';

const PROSE_CLASS =
  'prose prose-lg max-w-none prose-headings:text-slate-800 prose-headings:font-bold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-800 prose-table:w-full prose-table:border-collapse prose-th:bg-slate-100 prose-th:p-3 prose-th:text-left prose-td:p-3 prose-td:border prose-td:border-slate-200 prose-img:rounded-lg';

interface BlogPostBodyProps {
  content: string;
  split: BlogContentSplit | null;
  className?: string;
}

export function BlogPostBody({ content, split, className }: BlogPostBodyProps) {
  if (!split) {
    return (
      <div
        className={cn(PROSE_CLASS, className)}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className={cn(PROSE_CLASS, className)}>
      <div dangerouslySetInnerHTML={{ __html: split.before }} />
      <AdBlogMid />
      <div dangerouslySetInnerHTML={{ __html: split.after }} />
    </div>
  );
}
