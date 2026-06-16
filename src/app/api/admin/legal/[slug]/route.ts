import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { invalidateLegalPageCache } from '@/lib/legal-pages';
import type { LegalPageSlug } from '@/types/legal-page';

const DEFAULT_TITLES: Record<
  LegalPageSlug,
  { title_ko: string; title_en: string }
> = {
  privacy: { title_ko: '개인정보처리방침', title_en: 'Privacy Policy' },
  terms: { title_ko: '이용약관', title_en: 'Terms of Service' },
};

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

  const contentKo = String(body.content_ko ?? '').trim();
  if (!contentKo) {
    return NextResponse.json({ error: '본문(한국어)을 입력해주세요.' }, { status: 400 });
  }

  const defaults = DEFAULT_TITLES[slug as LegalPageSlug];
  const effectiveDateRaw = String(body.effective_date ?? '').trim();

  if (slug === 'terms' && !effectiveDateRaw) {
    return NextResponse.json({ error: '시행일을 입력해주세요.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from('legal_pages')
    .select('effective_date')
    .eq('slug', slug)
    .maybeSingle();

  const { data, error } = await supabase
    .from('legal_pages')
    .upsert({
      slug: slug as LegalPageSlug,
      title_ko: defaults.title_ko,
      title_en: defaults.title_en,
      content_ko: contentKo,
      content_en: String(body.content_en ?? '').trim() || null,
      effective_date:
        slug === 'terms'
          ? effectiveDateRaw
          : existing?.effective_date ?? new Date().toISOString().slice(0, 10),
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
