import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { invalidateBlogCache } from '@/lib/blog/cache-invalidation';
import { sanitizeBlogSlugForStorage } from '@/lib/blog-utils';
import type { BlogPostStatus } from '@/types/blog';

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ post: data });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const title = body.title !== undefined ? String(body.title).trim() : existing.title;
  const content =
    body.content !== undefined ? String(body.content).trim() : existing.content;
  const slug = sanitizeBlogSlugForStorage(
    body.slug !== undefined ? String(body.slug) : String(existing.slug),
    title,
  );
  const status = (body.status as BlogPostStatus | undefined) ?? existing.status;

  let publishedAt = existing.published_at;
  if (body.published_at !== undefined) {
    publishedAt = String(body.published_at) || null;
  } else if (status === 'published' && !publishedAt) {
    publishedAt = new Date().toISOString();
  } else if (status === 'draft') {
    publishedAt = null;
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .update({
      title,
      slug,
      content,
      meta_description:
        body.meta_description !== undefined
          ? String(body.meta_description).trim() || null
          : existing.meta_description,
      tags: body.tags !== undefined ? body.tags : existing.tags,
      category:
        body.category !== undefined
          ? String(body.category).trim() || null
          : existing.category,
      status,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  invalidateBlogCache(existing.slug as string);
  invalidateBlogCache(data.slug as string);

  return NextResponse.json({ post: data });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase.from('blog_posts').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  invalidateBlogCache();
  return NextResponse.json({ success: true });
}
