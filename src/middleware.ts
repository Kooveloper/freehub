import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import { ADMIN_COOKIE_NAME, verifyAdminToken } from '@/lib/admin-auth';

const OAUTH_ERROR_CODES = new Set([
  'flow_state_already_used',
  'flow_state_not_found',
  'flow_state_expired',
  'oauth_invalid_state',
]);

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const oauthErrorCode = request.nextUrl.searchParams.get('error_code');

  if (
    oauthErrorCode &&
    OAUTH_ERROR_CODES.has(oauthErrorCode) &&
    pathname !== '/login'
  ) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('error', 'auth_callback_error');
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      return response;
    }

    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    if (!token || !(await verifyAdminToken(token))) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
