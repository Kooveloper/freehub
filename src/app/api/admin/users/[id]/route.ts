import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { validateUserUpdate } from '@/lib/admin/users';
import { getAdminUserById } from '@/lib/supabase/admin-users';

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const user = await getAdminUserById(id);
    if (!user) {
      return NextResponse.json({ error: '회원을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '회원 조회에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const input = validateUserUpdate(body);
  if (!input) {
    return NextResponse.json(
      { error: '입력값을 확인해주세요. (비밀번호 6자 이상)' },
      { status: 400 },
    );
  }

  const existing = await getAdminUserById(id);
  if (!existing) {
    return NextResponse.json({ error: '회원을 찾을 수 없습니다.' }, { status: 404 });
  }

  const supabase = createServiceClient();

  if ('action' in input) {
    const { data, error } = await supabase.auth.admin.updateUserById(id, {
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email ?? '',
            email_verified: Boolean(data.user.email_confirmed_at),
            email_confirmed_at: data.user.email_confirmed_at ?? null,
          }
        : null,
    });
  }

  const { data, error } = await supabase.auth.admin.updateUserById(id, {
    password: input.password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    user: data.user
      ? {
          id: data.user.id,
          email: data.user.email ?? '',
        }
      : null,
  });
}
