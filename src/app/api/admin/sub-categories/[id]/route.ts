import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { validateSubCategoryInput, validateSubCategoryPatch } from '@/lib/admin/sub-categories';
import { invalidatePublicCache } from '@/lib/cache-invalidation';

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
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

  const input = validateSubCategoryPatch(body);
  if (!input) {
    return NextResponse.json(
      { error: '입력값을 확인해주세요.' },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from('sub_categories')
    .select('id, category_slug, slug')
    .eq('id', id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json(
      { error: '서브카테고리를 찾을 수 없습니다.' },
      { status: 404 },
    );
  }

  const { data, error } = await supabase
    .from('sub_categories')
    .update({
      name: input.name,
      sort_order: input.sort_order,
      is_active: input.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await invalidatePublicCache({ categorySlugs: [existing.category_slug] });

  return NextResponse.json({ subCategory: data });
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
    .from('sub_categories')
    .select('id, name, slug, category_slug')
    .eq('id', id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json(
      { error: '서브카테고리를 찾을 수 없습니다.' },
      { status: 404 },
    );
  }

  const { count } = await supabase
    .from('tools')
    .select('id', { count: 'exact', head: true })
    .eq('sub_category', existing.slug);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: `이 서브카테고리에 ${count}개의 툴이 연결되어 있어 삭제할 수 없습니다.` },
      { status: 409 },
    );
  }

  const { error } = await supabase.from('sub_categories').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await invalidatePublicCache({ categorySlugs: [existing.category_slug] });

  return NextResponse.json({ success: true });
}
