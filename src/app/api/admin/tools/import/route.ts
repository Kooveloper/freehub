import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import {
  importToolsFromExcelRows,
  parseToolExcelRows,
} from '@/lib/admin/tool-excel';
import { invalidatePublicCache } from '@/lib/cache-invalidation';
import {
  getAdminCategories,
  getAdminSubCategories,
} from '@/lib/supabase/admin-queries';

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, {
      status: 400,
    });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: '엑셀 파일을 선택해주세요.' }, {
      status: 400,
    });
  }

  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return NextResponse.json(
      { error: 'xlsx 파일만 업로드할 수 있습니다.' },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = parseToolExcelRows(buffer);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: '업로드한 파일에 서비스 데이터가 없습니다.' },
        { status: 400 },
      );
    }

    const [categories, subCategories] = await Promise.all([
      getAdminCategories(),
      getAdminSubCategories(),
    ]);

    const supabase = createServiceClient();
    const result = await importToolsFromExcelRows(
      rows,
      categories,
      subCategories,
      supabase,
      { includeI18n: process.env.TOOLS_DB_HAS_I18N === 'true' },
    );

    await invalidatePublicCache({
      categorySlugs: categories.map((category) => category.slug),
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '엑셀 업로드 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
