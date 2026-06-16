import { notFound } from 'next/navigation';

import { BlogForm } from '@/components/admin/BlogForm';
import { getBlogPostByIdAdmin } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBlogEditPage({ params }: PageProps) {
  const { id } = await params;
  const post = await getBlogPostByIdAdmin(id);

  if (!post) notFound();

  return <BlogForm initialPost={post} />;
}
