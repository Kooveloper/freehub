import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BlogPostDetailView } from '@/components/blog/BlogPostDetailView';
import {
  getAllBlogSlugs,
  getBlogPostBySlug,
} from '@/lib/supabase/queries';

export const revalidate = 3600;

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllBlogSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: '글을 찾을 수 없습니다 | FreeHub' };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://freehub.kr';

  return {
    title: `${post.title} | FreeHub 블로그`,
    description: post.meta_description ?? post.title,
    openGraph: {
      title: post.title,
      description: post.meta_description ?? undefined,
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      url: `${baseUrl}/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) notFound();

  return <BlogPostDetailView post={post} />;
}
