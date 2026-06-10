import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { invalidateLegalPageCache } from '@/lib/legal-pages';
import type { LegalPageSlug } from '@/types/legal-page';

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { slug } = await params;
  if (slug !== 'privacy' && slug !== 'terms') {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('legal_pages')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ page: data });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { slug } = await params;
  if (slug !== 'privacy' && slug !== 'terms') {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const titleKo = String(body.title_ko ?? '').trim();
  const contentKo = String(body.content_ko ?? '').trim();
  const effectiveDate = String(body.effective_date ?? '').trim();

  if (!titleKo || !contentKo || !effectiveDate) {
    return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('legal_pages')
    .upsert({
      slug: slug as LegalPageSlug,
      title_ko: titleKo,
      title_en: String(body.title_en ?? '').trim() || null,
      content_ko: contentKo,
      content_en: String(body.content_en ?? '').trim() || null,
      effective_date: effectiveDate,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await invalidateLegalPageCache(slug as LegalPageSlug);
  revalidatePath(slug === 'privacy' ? '/privacy' : '/terms');

  return NextResponse.json({ page: data });
}
