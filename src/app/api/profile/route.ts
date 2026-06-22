import { NextResponse } from 'next/server';

import { createUserProfile, getProfileByUserId, updateUserNickname } from '@/lib/supabase/profiles';
import type { ProfileConsentInput } from '@/lib/supabase/profiles';
import { isValidSignupPassword } from '@/lib/password';
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
    const provider = auth.user.app_metadata?.provider ?? 'email';
    return NextResponse.json({
      profile,
      email: auth.user.email ?? '',
      isEmailUser: provider === 'email',
    });
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
  const consent: ProfileConsentInput | null =
    body?.terms_agreed_at && body?.privacy_agreed_at
      ? {
          terms_agreed_at: String(body.terms_agreed_at),
          privacy_agreed_at: String(body.privacy_agreed_at),
          marketing_opt_in: Boolean(body.marketing_opt_in),
          marketing_opt_in_at:
            typeof body.marketing_opt_in_at === 'string'
              ? body.marketing_opt_in_at
              : null,
        }
      : null;

  if (!nickname) {
    return NextResponse.json({ error: '닉네임을 입력해 주세요.' }, { status: 400 });
  }

  if (!consent?.terms_agreed_at || !consent.privacy_agreed_at) {
    return NextResponse.json({ error: '필수 약관에 동의해 주세요.' }, { status: 400 });
  }

  const existing = await getProfileByUserId(auth.supabase, auth.user.id);
  if (existing) {
    return NextResponse.json({ error: '이미 프로필이 있습니다.' }, { status: 400 });
  }

  const { profile, error } = await createUserProfile(
    auth.supabase,
    auth.user.id,
    nickname,
    consent,
  );

  if (error || !profile) {
    return NextResponse.json({ error: error ?? '프로필 생성 실패' }, { status: 400 });
  }

  return NextResponse.json({ profile });
}

function isEmailProvider(user: { app_metadata?: { provider?: string } }) {
  const provider = user.app_metadata?.provider ?? 'email';
  return provider === 'email';
}

/** PATCH: { currentPassword?, nickname?, newPassword?, newPasswordConfirm? } */
export async function PATCH(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json();
  const currentPassword = String(body?.currentPassword ?? '');
  const nickname =
    body?.nickname !== undefined ? String(body.nickname).trim() : undefined;
  const newPassword =
    body?.newPassword !== undefined ? String(body.newPassword) : undefined;
  const newPasswordConfirm =
    body?.newPasswordConfirm !== undefined
      ? String(body.newPasswordConfirm)
      : undefined;

  const emailUser = isEmailProvider(auth.user);
  const wantsPasswordChange = Boolean(newPassword || newPasswordConfirm);
  const wantsNicknameChange = nickname !== undefined;

  if (!wantsNicknameChange && !wantsPasswordChange) {
    return NextResponse.json({ error: '변경할 항목을 입력해 주세요.' }, { status: 400 });
  }

  if (emailUser && (wantsNicknameChange || wantsPasswordChange)) {
    if (!currentPassword) {
      return NextResponse.json(
        { error: '현재 비밀번호를 입력해 주세요.' },
        { status: 400 },
      );
    }

    const { error: verifyError } = await auth.supabase.auth.signInWithPassword({
      email: auth.user.email!,
      password: currentPassword,
    });

    if (verifyError) {
      return NextResponse.json(
        { error: '현재 비밀번호가 올바르지 않습니다.' },
        { status: 400 },
      );
    }
  }

  if (wantsNicknameChange) {
    const profile = await getProfileByUserId(auth.supabase, auth.user.id);
    if (!profile) {
      return NextResponse.json({ error: '프로필이 없습니다.' }, { status: 400 });
    }

    const { profile: updated, error } = await updateUserNickname(
      auth.supabase,
      auth.user.id,
      nickname!,
    );

    if (error || !updated) {
      return NextResponse.json({ error: error ?? '닉네임 변경 실패' }, { status: 400 });
    }
  }

  if (wantsPasswordChange) {
    if (!emailUser) {
      return NextResponse.json(
        { error: '소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.' },
        { status: 400 },
      );
    }

    if (!newPassword || !isValidSignupPassword(newPassword)) {
      return NextResponse.json(
        { error: '새 비밀번호는 영문과 숫자를 포함해 6자 이상이어야 합니다.' },
        { status: 400 },
      );
    }

    if (newPassword !== newPasswordConfirm) {
      return NextResponse.json(
        { error: '새 비밀번호 확인이 일치하지 않습니다.' },
        { status: 400 },
      );
    }

    const { error: passwordError } = await auth.supabase.auth.updateUser({
      password: newPassword,
    });

    if (passwordError) {
      return NextResponse.json({ error: passwordError.message }, { status: 500 });
    }
  }

  const profile = await getProfileByUserId(auth.supabase, auth.user.id);
  return NextResponse.json({ profile, success: true });
}
