import { NextResponse } from 'next/server';

import { localizeTools } from '@/lib/i18n/content';
import { getLocale } from '@/lib/locale';
import { getToolsByCategory } from '@/lib/supabase/queries';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const locale = await getLocale();

  try {
    const tools = await getToolsByCategory(slug);
    return NextResponse.json({ tools: localizeTools(tools, locale) });
  } catch (error) {
    const message = error instanceof Error ? error.message : '서비스 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
