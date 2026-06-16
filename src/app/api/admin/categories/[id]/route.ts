import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import {
  getToolCountByCategorySlug,
  swapCategoryOrder,
  validateCategoryInput,
} from '@/lib/admin/categories';
import { invalidatePublicCache } from '@/lib/cache-invalidation';

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface RouteContext {
  params: Promise<{ id: string }>;
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

  const { data: existing, error: fetchError } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: '카테고리를 찾을 수 없습니다.' },
      { status: 404 },
    );
  }

  if (body.action === 'move_up' || body.action === 'move_down') {
    const result = await swapCategoryOrder(
      supabase,
      id,
      body.action === 'move_up' ? 'up' : 'down',
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await invalidatePublicCache({ categorySlugs: [existing.slug] });

    return NextResponse.json({ success: true });
  }

  if (typeof body.is_active === 'boolean') {
    const { error } = await supabase
      .from('categories')
      .update({ is_active: body.is_active })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await invalidatePublicCache({ categorySlugs: [existing.slug] });

    return NextResponse.json({ success: true });
  }

  const input = validateCategoryInput(
    {
      slug: existing.slug,
      name: body.name ?? existing.name,
      name_en: body.name_en ?? existing.name_en,
      description: body.description ?? existing.description,
      description_en: body.description_en ?? existing.description_en,
      icon: body.icon ?? existing.icon,
      color: body.color ?? existing.color,
      sort_order: body.sort_order ?? existing.sort_order,
    },
    { slugRequired: true },
  );

  if (!input) {
    return NextResponse.json(
      { error: '입력값을 확인해주세요.' },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('categories')
    .update({
      name: input.name,
      name_en: input.name_en || null,
      description: input.description,
      description_en: input.description_en || null,
      icon: input.icon,
      color: input.color,
      sort_order: input.sort_order,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await invalidatePublicCache({ categorySlugs: [existing.slug] });

  return NextResponse.json({ category: data });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const supabase = createServiceClient();

  const { data: existing, error: fetchError } = await supabase
    .from('categories')
    .select('slug')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: '카테고리를 찾을 수 없습니다.' },
      { status: 404 },
    );
  }

  try {
    const toolCount = await getToolCountByCategorySlug(supabase, existing.slug);
    if (toolCount > 0) {
      return NextResponse.json(
        {
          error: `이 카테고리에 ${toolCount}개의 서비스가 연결되어 있어 삭제할 수 없습니다.`,
        },
        { status: 409 },
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '서비스 수 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await invalidatePublicCache({ categorySlugs: [existing.slug] });

  return NextResponse.json({ success: true });
}
