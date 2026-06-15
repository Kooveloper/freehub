import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { buildToolsExcelBuffer } from '@/lib/admin/tool-excel';
import {
  getAdminCategories,
  getAdminSubCategories,
  getAdminTools,
} from '@/lib/supabase/admin-queries';

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const [tools, categories, subCategories] = await Promise.all([
      getAdminTools(),
      getAdminCategories(),
      getAdminSubCategories(),
    ]);

    const buffer = buildToolsExcelBuffer(tools, categories, subCategories);
    const filename = `FreeHub_Admin_툴데이터_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '엑셀 다운로드 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
