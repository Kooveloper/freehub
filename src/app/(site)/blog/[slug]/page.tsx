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

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) notFound();

  return <BlogPostDetailView post={post} />;
}
