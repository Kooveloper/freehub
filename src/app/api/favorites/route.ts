import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/** 로그인 유저 확인 — 미로그인 시 401 */
async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return { supabase, user };
}

/** GET: 현재 유저 즐겨찾기 toolId 배열 */
export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from('favorites')
    .select('tool_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const favorites = (data ?? []).map((row) => row.tool_id as string);
  return NextResponse.json({ favorites });
}

/** POST: { toolId } → 즐겨찾기 추가 */
export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { supabase, user } = auth;
  const body = await request.json();
  const toolId = body?.toolId as string | undefined;

  if (!toolId) {
    return NextResponse.json({ error: 'toolId가 필요합니다.' }, { status: 400 });
  }

  const { error } = await supabase.from('favorites').insert({
    user_id: user.id,
    tool_id: toolId,
  });

  if (error) {
    // 이미 존재하는 경우 무시
    if (error.code === '23505') {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/** DELETE: { toolId } → 즐겨찾기 제거 */
export async function DELETE(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { supabase, user } = auth;
  const body = await request.json();
  const toolId = body?.toolId as string | undefined;

  if (!toolId) {
    return NextResponse.json({ error: 'toolId가 필요합니다.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('tool_id', toolId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
