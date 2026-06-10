import { Ratelimit } from '@upstash/ratelimit';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { redis } from '@/lib/redis';

const TITLE_MAX = 50;
const CONTENT_MAX = 300;
const EMAIL_MAX = 100;

const requestRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, '1 d'),
  prefix: 'tool-requests',
});

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** POST: { title, content, email? } → tool_requests INSERT */
export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    const { success: withinLimit } = await requestRatelimit.limit(ip);
    if (!withinLimit) {
      return NextResponse.json(
        { error: '하루 요청 한도를 초과했습니다.' },
        { status: 429 },
      );
    }
  } catch (error) {
    console.error('Rate limit 확인 실패:', error);
  }

  const body = await request.json();
  const title = (body?.title as string | undefined)?.trim() ?? '';
  const content = (body?.content as string | undefined)?.trim() ?? '';
  const emailRaw = (body?.email as string | undefined)?.trim() ?? '';

  if (!title || title.length > TITLE_MAX) {
    return NextResponse.json(
      { error: '제목을 1~50자 이내로 입력해주세요.' },
      { status: 400 },
    );
  }

  if (!content || content.length > CONTENT_MAX) {
    return NextResponse.json(
      { error: '내용을 1~300자 이내로 입력해주세요.' },
      { status: 400 },
    );
  }

  if (emailRaw.length > EMAIL_MAX) {
    return NextResponse.json(
      { error: '이메일은 100자 이내로 입력해주세요.' },
      { status: 400 },
    );
  }

  if (emailRaw && !isValidEmail(emailRaw)) {
    return NextResponse.json(
      { error: '올바른 이메일 형식이 아닙니다.' },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  const { error } = await supabase.from('tool_requests').insert({
    title,
    content,
    email: emailRaw || null,
  });

  if (error) {
    console.error('tool_requests INSERT 실패:', error.message);
    return NextResponse.json(
      { error: '요청 저장에 실패했습니다.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
