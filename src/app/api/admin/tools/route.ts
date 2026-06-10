import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { sanitizeToolForDb, validateToolInput } from '@/lib/admin/tools';
import { invalidatePublicCache } from '@/lib/cache-invalidation';
import { getAdminTools } from '@/lib/supabase/admin-queries';

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const tools = await getAdminTools();
    return NextResponse.json({ tools });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '툴 목록 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

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
    .select('id')
    .eq('slug', input.slug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: '이미 사용 중인 슬러그입니다.' },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('tools')
    .insert({
      ...sanitizeToolForDb(input),
      verified_date: input.is_verified ? now : null,
      last_edited_at: now,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await invalidatePublicCache({
    categorySlugs: [input.category_slug],
    toolSlug: input.slug,
  });

  return NextResponse.json({ tool: data }, { status: 201 });
}
