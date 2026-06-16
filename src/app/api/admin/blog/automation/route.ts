import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import {
  getAutomationSettings,
  updateAutomationSettings,
} from '@/lib/supabase/blog-queries';
import type { BlogAutomationSettings } from '@/types/blog';

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const settings = await getAutomationSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : '조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  let body: Partial<BlogAutomationSettings>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    await updateAutomationSettings(body);
    const settings = await getAutomationSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : '저장 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
