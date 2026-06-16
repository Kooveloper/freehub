import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { generateBlogSlug } from '@/lib/blog-utils';
import type { BlogPostSource, BlogPostStatus } from '@/types/blog';

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const title = String(body.title ?? '').trim();
  const content = String(body.content ?? '').trim();
  if (!title || !content) {
    return NextResponse.json({ error: '제목과 본문은 필수입니다.' }, { status: 400 });
  }

  const slugRaw = String(body.slug ?? '').trim();
  const slug = slugRaw || generateBlogSlug(title);
  const status = (body.status as BlogPostStatus) ?? 'draft';
  const source = (body.source as BlogPostSource) ?? 'manual';
  const publishedAt =
    status === 'published'
      ? String(body.published_at ?? new Date().toISOString())
      : null;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      title,
      slug,
      content,
      meta_description: String(body.meta_description ?? '').trim() || null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      category: String(body.category ?? '').trim() || null,
      status,
      source,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath('/blog');
  return NextResponse.json({ post: data });
}
