import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** PATCH: { rating, content } */
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json();
  const rating = body?.rating !== undefined ? Number(body.rating) : undefined;
  const content =
    body?.content !== undefined ? String(body.content).trim() : undefined;

  if (rating !== undefined && (Number.isNaN(rating) || rating < 1 || rating > 5)) {
    return NextResponse.json({ error: '별점은 1~5 사이여야 합니다.' }, { status: 400 });
  }
  if (content !== undefined && !content) {
    return NextResponse.json({ error: '리뷰 내용을 입력해 주세요.' }, { status: 400 });
  }
  if (content && content.length > 2000) {
    return NextResponse.json({ error: '리뷰는 2000자 이하로 작성해 주세요.' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (rating !== undefined) updates.rating = rating;
  if (content !== undefined) updates.content = content;

  const { error } = await supabase
    .from('tool_reviews')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/** DELETE */
export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { error } = await supabase
    .from('tool_reviews')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
