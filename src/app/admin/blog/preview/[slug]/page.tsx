import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BlogPostDetailView } from '@/components/blog/BlogPostDetailView';
import { getBlogPostBySlugAdmin } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

interface AdminBlogPreviewPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdminBlogPreviewPage({
  params,
}: AdminBlogPreviewPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlugAdmin(slug);

  if (!post) notFound();

  return (
    <div>
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-amber-900">
            미리보기 모드
            {post.status === 'draft' && ' · 초안 (비공개)'}
          </p>
          <div className="flex items-center gap-3 text-sm">
            {post.status === 'published' && (
              <a
                href={`/blog/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                공개 페이지 보기 →
              </a>
            )}
            <Link
              href={`/admin/blog/${post.id}`}
              className="font-medium text-neutral-700 hover:underline"
            >
              편집으로 돌아가기
            </Link>
          </div>
        </div>
      </div>

      <BlogPostDetailView post={post} trackViews={post.status === 'published'} />
    </div>
  );
}
