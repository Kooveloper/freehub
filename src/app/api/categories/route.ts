import { NextResponse } from 'next/server';

import { localizeCategories } from '@/lib/i18n/content';
import { getLocale } from '@/lib/locale';
import { getAllCategories } from '@/lib/supabase/queries';

export async function GET() {
  const locale = await getLocale();
  const categories = await getAllCategories();
  return NextResponse.json({
    categories: localizeCategories(categories, locale),
  });
}
