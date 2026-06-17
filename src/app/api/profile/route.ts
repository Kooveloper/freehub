import { NextResponse } from 'next/server';

import { createUserProfile, getProfileByUserId } from '@/lib/supabase/profiles';
import { createClient } from '@/lib/supabase/server';

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return { supabase, user };
}

/** GET: 현재 유저 프로필 */
export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    const profile = await getProfileByUserId(auth.supabase, auth.user.id);
    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : '프로필 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST: { nickname } — 프로필 생성 (OAuth 가입 후 등) */
export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json();
  const nickname = body?.nickname as string | undefined;

  if (!nickname) {
    return NextResponse.json({ error: '닉네임을 입력해 주세요.' }, { status: 400 });
  }

  const existing = await getProfileByUserId(auth.supabase, auth.user.id);
  if (existing) {
    return NextResponse.json({ error: '이미 프로필이 있습니다.' }, { status: 400 });
  }

  const { profile, error } = await createUserProfile(
    auth.supabase,
    auth.user.id,
    nickname,
  );

  if (error || !profile) {
    return NextResponse.json({ error: error ?? '프로필 생성 실패' }, { status: 400 });
  }

  return NextResponse.json({ profile });
}
