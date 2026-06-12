import { NextResponse } from 'next/server';

import { getAllSubCategories } from '@/lib/supabase/queries';

export async function GET() {
  try {
    const subCategories = await getAllSubCategories();
    return NextResponse.json({ subCategories });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '서브카테고리 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
