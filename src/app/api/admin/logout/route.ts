import { NextResponse } from 'next/server';

import { ADMIN_COOKIE_NAME } from '@/lib/admin-auth';

export function GET(request: Request) {
  const loginUrl = new URL('/admin/login', request.url);
  const response = NextResponse.redirect(loginUrl);

  response.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  });
  response.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, private',
  );

  return response;
}
