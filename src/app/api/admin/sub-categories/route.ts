import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { validateSubCategoryInput } from '@/lib/admin/sub-categories';
import { invalidatePublicCache } from '@/lib/cache-invalidation';
import { getAdminSubCategories } from '@/lib/supabase/admin-queries';

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get('category_slug')?.trim();

  try {
    const subCategories = await getAdminSubCategories();
    const filtered = categorySlug
      ? subCategories.filter((sub) => sub.category_slug === categorySlug)
      : subCategories;

    return NextResponse.json({ subCategories: filtered });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '서브카테고리 조회 실패';
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

  const input = validateSubCategoryInput(body);
  if (!input) {
    return NextResponse.json(
      { error: '입력값을 확인해주세요.' },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  const { data: category } = await supabase
    .from('categories')
    .select('slug')
    .eq('slug', input.category_slug)
    .maybeSingle();

  if (!category) {
    return NextResponse.json(
      { error: '존재하지 않는 대카테고리입니다.' },
      { status: 400 },
    );
  }

  const { data: existing } = await supabase
    .from('sub_categories')
    .select('id')
    .eq('slug', input.slug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: '이미 사용 중인 슬러그입니다.' },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from('sub_categories')
    .insert({
      slug: input.slug,
      name: input.name,
      name_en: input.name_en || null,
      category_slug: input.category_slug,
      sort_order: input.sort_order,
      is_active: input.is_active,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await invalidatePublicCache({ categorySlugs: [input.category_slug] });

  return NextResponse.json({ subCategory: data }, { status: 201 });
}
