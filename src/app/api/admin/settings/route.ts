import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { invalidateSiteSettingsCache } from '@/lib/site-settings';

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}

export async function PATCH(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: existing, error: fetchError } = await supabase
    .from('site_settings')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const payload = {
    ads_enabled: Boolean(body.ads_enabled),
    adsense_publisher_id: String(body.adsense_publisher_id ?? '').trim() || null,
    ad_slot_home_top: String(body.ad_slot_home_top ?? '').trim() || null,
    ad_slot_in_feed: String(body.ad_slot_in_feed ?? '').trim() || null,
    ad_slot_sidebar: String(body.ad_slot_sidebar ?? '').trim() || null,
    ad_slot_detail_btm: String(body.ad_slot_detail_btm ?? '').trim() || null,
    ad_slot_blog_mid: String(body.ad_slot_blog_mid ?? '').trim() || null,
    ga_measurement_id: String(body.ga_measurement_id ?? '').trim() || null,
    google_site_verification: String(body.google_site_verification ?? '').trim() || null,
    naver_site_verification: String(body.naver_site_verification ?? '').trim() || null,
    bing_site_verification: String(body.bing_site_verification ?? '').trim() || null,
    site_name: String(body.site_name ?? '').trim() || null,
    meta_title_ko: String(body.meta_title_ko ?? '').trim() || null,
    meta_title_en: String(body.meta_title_en ?? '').trim() || null,
    meta_description_ko: String(body.meta_description_ko ?? '').trim() || null,
    meta_description_en: String(body.meta_description_en ?? '').trim() || null,
    og_title_ko: String(body.og_title_ko ?? '').trim() || null,
    og_title_en: String(body.og_title_en ?? '').trim() || null,
    og_description_ko: String(body.og_description_ko ?? '').trim() || null,
    og_description_en: String(body.og_description_en ?? '').trim() || null,
    og_image_url: String(body.og_image_url ?? '').trim() || null,
    favicon_url: String(body.favicon_url ?? '').trim() || null,
    extra_head_html: String(body.extra_head_html ?? '').trim() || null,
    updated_at: new Date().toISOString(),
  };

  const query = existing?.id
    ? supabase.from('site_settings').update(payload).eq('id', existing.id)
    : supabase.from('site_settings').insert(payload);

  const { data, error } = await query.select('*').single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await invalidateSiteSettingsCache();
  revalidatePath('/', 'layout');
  revalidatePath('/privacy');
  revalidatePath('/terms');

  return NextResponse.json({ settings: data });
}
