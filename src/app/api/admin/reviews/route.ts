import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { getReviewsForAdmin } from '@/lib/supabase/review-queries';

export async function GET(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const toolId = searchParams.get('toolId');
  const categorySlug = searchParams.get('categorySlug');
  const subCategorySlug = searchParams.get('subCategorySlug');
  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? '20');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  try {
    const data = await getReviewsForAdmin({
      toolId,
      categorySlug,
      subCategorySlug,
      from,
      to,
      page: Number.isNaN(page) ? 1 : page,
      pageSize: Number.isNaN(pageSize) ? 20 : pageSize,
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : '리뷰 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
