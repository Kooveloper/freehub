import { NextResponse } from 'next/server';

import { ADMIN_COOKIE_NAME } from '@/lib/admin-auth';

export function GET(request: Request) {
  const homeUrl = new URL('/', request.url);
  const response = NextResponse.redirect(homeUrl);

  response.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
