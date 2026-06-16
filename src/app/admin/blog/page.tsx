import { Suspense } from 'react';

import { BlogPostsManager } from '@/components/admin/BlogPostsManager';
import { getAllBlogPostsAdmin } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

function Fallback() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-400">
      블로그 글 목록을 불러오는 중…
    </div>
  );
}

export default async function AdminBlogPage() {
  const posts = await getAllBlogPostsAdmin();

  return (
    <Suspense fallback={<Fallback />}>
      <BlogPostsManager posts={posts} />
    </Suspense>
  );
}
