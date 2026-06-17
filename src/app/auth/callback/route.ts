import { NextResponse } from 'next/server';

import { resolveAppOrigin } from '@/lib/auth-redirect';
import { createClient } from '@/lib/supabase/server';

/** Google OAuth 및 이메일 확인 콜백 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const appOrigin = resolveAppOrigin(requestUrl.origin);
  const next = searchParams.get('next') ?? '/';

  const oauthError = searchParams.get('error');
  const oauthErrorCode = searchParams.get('error_code');

  if (oauthError) {
    const loginUrl = new URL('/login', appOrigin);
    loginUrl.searchParams.set('error', 'auth_callback_error');
    if (oauthErrorCode) {
      loginUrl.searchParams.set('error_code', oauthErrorCode);
    }
    const description = searchParams.get('error_description');
    if (description) {
      loginUrl.searchParams.set('error_description', description);
    }
    return NextResponse.redirect(loginUrl);
  }

  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { ensureUserProfile } = await import('@/lib/supabase/profiles');
        const { needsNickname } = await ensureUserProfile(supabase, user);

        if (needsNickname) {
          const completeUrl = new URL('/signup/complete', appOrigin);
          completeUrl.searchParams.set('next', next.startsWith('/') ? next : '/');
          return NextResponse.redirect(completeUrl);
        }
      }

      const redirectPath = next.startsWith('/') ? next : '/';
      return NextResponse.redirect(`${appOrigin}${redirectPath}`);
    }

    const loginUrl = new URL('/login', appOrigin);
    loginUrl.searchParams.set('error', 'auth_callback_error');
    if (error.message) {
      loginUrl.searchParams.set('error_description', error.message);
    }
    return NextResponse.redirect(loginUrl);
  }

  const loginUrl = new URL('/login', appOrigin);
  loginUrl.searchParams.set('error', 'auth_callback_error');
  return NextResponse.redirect(loginUrl);
}
