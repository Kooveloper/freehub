import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { invalidatePublicCache } from '@/lib/cache-invalidation';
import { redis } from '@/lib/redis';

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: rows, error } = await supabase
    .from('category_featured_tools')
    .select('tool_id, sort_order')
    .eq('category_slug', slug)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const toolIds = (rows ?? []).map((row) => row.tool_id as string);
  if (toolIds.length === 0) {
    return NextResponse.json({ featured: [] });
  }

  const { data: tools, error: toolsError } = await supabase
    .from('tools')
    .select('id, name, slug, logo_url, view_count')
    .in('id', toolIds);

  if (toolsError) {
    return NextResponse.json({ error: toolsError.message }, { status: 500 });
  }

  const toolMap = new Map((tools ?? []).map((tool) => [tool.id, tool]));
  const featured = (rows ?? []).map((row) => ({
    tool_id: row.tool_id,
    sort_order: row.sort_order,
    tool: toolMap.get(row.tool_id as string),
  }));

  return NextResponse.json({ featured });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { slug } = await params;
  let body: { tool_ids?: string[] };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const toolIds = (body.tool_ids ?? []).slice(0, 5);
  const supabase = createServiceClient();

  const { error: deleteError } = await supabase
    .from('category_featured_tools')
    .delete()
    .eq('category_slug', slug);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (toolIds.length > 0) {
    const { error: insertError } = await supabase
      .from('category_featured_tools')
      .insert(
        toolIds.map((tool_id, index) => ({
          category_slug: slug,
          tool_id,
          sort_order: index,
        })),
      );

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  try {
    await redis.del('featured:popular');
  } catch {
    // ignore
  }

  await invalidatePublicCache({ categorySlugs: [slug] });

  return NextResponse.json({ success: true });
}
