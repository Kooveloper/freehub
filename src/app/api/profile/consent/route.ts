import { NextResponse } from 'next/server';

import type { ProfileConsentInput } from '@/lib/supabase/profiles';
import { upsertProfileConsent } from '@/lib/supabase/profiles';
import { createClient } from '@/lib/supabase/server';

function parseConsentBody(body: unknown): ProfileConsentInput | null {
  if (!body || typeof body !== 'object') return null;

  const record = body as Record<string, unknown>;
  const termsAgreedAt =
    typeof record.terms_agreed_at === 'string' ? record.terms_agreed_at : null;
  const privacyAgreedAt =
    typeof record.privacy_agreed_at === 'string' ? record.privacy_agreed_at : null;
  const marketingOptIn = Boolean(record.marketing_opt_in);
  const marketingOptInAt =
    typeof record.marketing_opt_in_at === 'string' ? record.marketing_opt_in_at : null;

  return {
    terms_agreed_at: termsAgreedAt,
    privacy_agreed_at: privacyAgreedAt,
    marketing_opt_in: marketingOptIn,
    marketing_opt_in_at: marketingOptInAt,
  };
}

/** POST: 가입 동의 정보 저장 (OAuth 가입 후 등) */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const consent = parseConsentBody(await request.json());
  if (!consent) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { profile, error } = await upsertProfileConsent(supabase, user.id, consent);

  if (error || !profile) {
    return NextResponse.json({ error: error ?? '동의 저장 실패' }, { status: 400 });
  }

  return NextResponse.json({ profile });
}
