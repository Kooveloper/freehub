import { Ratelimit } from '@upstash/ratelimit';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { sendSubmissionEmails } from '@/lib/email/submit-emails';
import { redis } from '@/lib/redis';
import type {
  BugPayload,
  InquiryPayload,
  LimitChangePayload,
  NewToolPayload,
  SubmissionType,
} from '@/types/submission';

const EMAIL_MAX = 100;

const submitRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(3, '1 h'),
  prefix: 'submissions',
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

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateNewTool(payload: unknown): NewToolPayload | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  const toolName = String(p.toolName ?? '').trim();
  const url = String(p.url ?? '').trim();
  const freeLimit = String(p.freeLimit ?? '').trim();
  const description = String(p.description ?? '').trim();

  if (!toolName || toolName.length > 100) return null;
  if (!url || !isValidUrl(url)) return null;
  if (!freeLimit || freeLimit.length > 200) return null;
  if (!description || description.length > 1000) return null;

  return { toolName, url, freeLimit, description };
}

function validateLimitChange(payload: unknown): LimitChangePayload | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  const toolId = String(p.toolId ?? '').trim();
  const toolName = String(p.toolName ?? '').trim();
  const changeContent = String(p.changeContent ?? '').trim();
  const evidenceUrl = String(p.evidenceUrl ?? '').trim();

  if (!toolId || !toolName) return null;
  if (!changeContent || changeContent.length > 1000) return null;
  if (!evidenceUrl || !isValidUrl(evidenceUrl)) return null;

  return { toolId, toolName, changeContent, evidenceUrl };
}

function validateBug(payload: unknown): BugPayload | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  const description = String(p.description ?? '').trim();
  const pageUrlRaw = String(p.pageUrl ?? '').trim();

  if (!description || description.length > 1000) return null;
  if (pageUrlRaw && !isValidUrl(pageUrlRaw)) return null;

  return {
    description,
    ...(pageUrlRaw ? { pageUrl: pageUrlRaw } : {}),
  };
}

function validateInquiry(payload: unknown): InquiryPayload | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  const title = String(p.title ?? '').trim();
  const content = String(p.content ?? '').trim();

  if (!title || title.length > 120) return null;
  if (!content || content.length > 2000) return null;

  return { title, content };
}

const VALID_TYPES = new Set<SubmissionType>([
  'new_tool',
  'limit_change',
  'bug',
  'inquiry',
]);

function submissionToRow(
  type: SubmissionType,
  payload:
    | NewToolPayload
    | LimitChangePayload
    | BugPayload
    | InquiryPayload,
  email: string | null,
): Record<string, unknown> {
  switch (type) {
    case 'new_tool': {
      const p = payload as NewToolPayload;
      return {
        type,
        tool_name: p.toolName,
        tool_url: p.url,
        description: `[무료 한도] ${p.freeLimit}\n\n${p.description}`,
        submitter_email: null,
        status: 'pending' as const,
      };
    }
    case 'limit_change': {
      const p = payload as LimitChangePayload;
      return {
        type,
        tool_name: p.toolName,
        tool_url: p.evidenceUrl,
        description: p.changeContent,
        submitter_email: null,
        status: 'pending' as const,
      };
    }
    case 'bug': {
      const p = payload as BugPayload;
      return {
        type,
        tool_name: null,
        tool_url: p.pageUrl ?? null,
        description: p.description,
        submitter_email: null,
        status: 'pending' as const,
      };
    }
    case 'inquiry': {
      const p = payload as InquiryPayload;
      return {
        type,
        tool_name: p.title,
        tool_url: null,
        description: p.content,
        submitter_email: email,
        status: 'pending' as const,
      };
    }
  }
}

/** POST: { type, email?, payload } → submissions INSERT + 이메일 발송 */
export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    const { success: withinLimit } = await submitRatelimit.limit(ip);
    if (!withinLimit) {
      return NextResponse.json(
        { error: '1시간 요청 한도(3회)를 초과했습니다.' },
        { status: 429 },
      );
    }
  } catch (error) {
    console.error('Rate limit 확인 실패:', error);
  }

  const body = await request.json();
  const type = body?.type as SubmissionType;
  const emailRaw = (body?.email as string | undefined)?.trim() ?? '';

  if (!type || !VALID_TYPES.has(type)) {
    return NextResponse.json({ error: '유효하지 않은 제보 유형입니다.' }, { status: 400 });
  }

  if (type === 'inquiry') {
    if (!emailRaw) {
      return NextResponse.json(
        { error: '답변 받을 이메일을 입력해주세요.' },
        { status: 400 },
      );
    }
    if (emailRaw.length > EMAIL_MAX) {
      return NextResponse.json(
        { error: '이메일은 100자 이내로 입력해주세요.' },
        { status: 400 },
      );
    }
    if (!isValidEmail(emailRaw)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 },
      );
    }
  }

  let payload:
    | NewToolPayload
    | LimitChangePayload
    | BugPayload
    | InquiryPayload
    | null = null;

  switch (type) {
    case 'new_tool':
      payload = validateNewTool(body?.payload);
      break;
    case 'limit_change':
      payload = validateLimitChange(body?.payload);
      break;
    case 'bug':
      payload = validateBug(body?.payload);
      break;
    case 'inquiry':
      payload = validateInquiry(body?.payload);
      break;
  }

  if (!payload) {
    return NextResponse.json(
      { error: '입력값을 확인해주세요.' },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  const row = submissionToRow(
    type,
    payload,
    type === 'inquiry' ? emailRaw : null,
  );

  const { error } = await supabase.from('submissions').insert(row);

  if (error) {
    console.error('submissions INSERT 실패:', error.message);
    return NextResponse.json(
      { error: '제보 저장에 실패했습니다.' },
      { status: 500 },
    );
  }

  try {
    await sendSubmissionEmails(
      type,
      payload,
      type === 'inquiry' ? emailRaw : undefined,
    );
  } catch (emailError) {
    console.error('제보 이메일 발송 실패:', emailError);
  }

  return NextResponse.json({ success: true });
}
