import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { sanitizeToolForDb, validateToolInput } from '@/lib/admin/tools';
import { invalidatePublicCache } from '@/lib/cache-invalidation';
import { getAdminToolById } from '@/lib/supabase/admin-queries';

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const tool = await getAdminToolById(id);
    if (!tool) {
      return NextResponse.json({ error: '툴을 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ tool });
  } catch (error) {
    const message = error instanceof Error ? error.message : '툴 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const input = validateToolInput(body);
  if (!input) {
    return NextResponse.json(
      { error: '입력값을 확인해주세요.' },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from('tools')
    .select('id, slug, category_slug, is_verified, verified_date')
    .eq('id', id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: '툴을 찾을 수 없습니다.' }, { status: 404 });
  }

  if (existing.slug !== input.slug) {
    const { data: slugConflict } = await supabase
      .from('tools')
      .select('id')
      .eq('slug', input.slug)
      .neq('id', id)
      .maybeSingle();

    if (slugConflict) {
      return NextResponse.json(
        { error: '이미 사용 중인 슬러그입니다.' },
        { status: 409 },
      );
    }
  }

  const now = new Date().toISOString();
  let verifiedDate: string | null = existing.verified_date;

  if (input.is_verified && !existing.is_verified) {
    verifiedDate = now;
  } else if (!input.is_verified) {
    verifiedDate = null;
  }

  const { data, error } = await supabase
    .from('tools')
    .upsert({
      id,
      ...sanitizeToolForDb(input),
      verified_date: verifiedDate,
      last_edited_at: now,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await invalidatePublicCache({
    categorySlugs: [existing.category_slug, input.category_slug],
    toolSlug: input.slug,
  });

  return NextResponse.json({ tool: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from('tools')
    .select('id, name, slug, category_slug')
    .eq('id', id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: '툴을 찾을 수 없습니다.' }, { status: 404 });
  }

  const { error } = await supabase.from('tools').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await invalidatePublicCache({
    categorySlugs: [existing.category_slug],
    toolSlug: existing.slug,
  });

  return NextResponse.json({ success: true });
}
