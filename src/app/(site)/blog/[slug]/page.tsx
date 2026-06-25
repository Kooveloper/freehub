import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BlogPostDetailView } from '@/components/blog/BlogPostDetailView';
import { normalizeBlogSlug } from '@/lib/blog-utils';
import { getLocale } from '@/lib/locale';
import { buildBlogPostMetadata } from '@/lib/seo/metadata';
import { getBlogPostBySlug } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const post = await getBlogPostBySlug(normalizeBlogSlug(slug));

  if (!post) {
    return {};
  }

  return buildBlogPostMetadata(
    post.title,
    post.meta_description,
    post.tags,
    locale,
  );
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(normalizeBlogSlug(slug));

  if (!post) notFound();

  return <BlogPostDetailView post={post} />;
}
