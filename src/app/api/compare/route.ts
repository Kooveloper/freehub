import { NextResponse } from 'next/server';

import { localizeTools } from '@/lib/i18n/content';
import { getLocale } from '@/lib/locale';
import { getToolsBySlugs } from '@/lib/supabase/queries';

const MAX_COMPARE = 3;

/** GET /api/compare?tools=slug1,slug2,slug3 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const toolsParam = searchParams.get('tools')?.trim() ?? '';

  if (!toolsParam) {
    return NextResponse.json({ tools: [] });
  }

  const slugs = toolsParam
    .split(',')
    .map((slug) => slug.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPARE);

  try {
    const locale = await getLocale();
    const tools = localizeTools(await getToolsBySlugs(slugs), locale);
    return NextResponse.json({ tools });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '비교 서비스 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
