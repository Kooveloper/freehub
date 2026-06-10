import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { validateCategoryInput } from '@/lib/admin/categories';
import { invalidatePublicCache } from '@/lib/cache-invalidation';
import { getAdminCategories } from '@/lib/supabase/admin-queries';

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
    const categories = await getAdminCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '카테고리 조회 실패';
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

  const input = validateCategoryInput(body);
  if (!input) {
    return NextResponse.json(
      { error: '입력값을 확인해주세요.' },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from('categories')
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
    .from('categories')
    .insert({
      slug: input.slug,
      name: input.name,
      name_en: input.name_en || null,
      description: input.description,
      description_en: input.description_en || null,
      icon: input.icon,
      color: input.color,
      sort_order: input.sort_order,
      is_active: true,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await invalidatePublicCache({ categorySlugs: [input.slug] });

  return NextResponse.json({ category: data }, { status: 201 });
}
