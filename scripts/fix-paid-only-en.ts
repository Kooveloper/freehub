import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'node:path';

import {
  translateFeatureList,
  translateFreeLimitUnit,
} from '../src/lib/i18n/tool-feature-translations';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.');
  process.exit(1);
}

function hasKorean(text: string): boolean {
  return /[가-힣]/.test(text);
}

async function main() {
  const supabase = createClient(supabaseUrl!, serviceKey!);
  const { data: tools, error } = await supabase
    .from('tools')
    .select('id, slug, paid_only_features, paid_only_features_en, free_limit_unit, free_limit_unit_en');

  if (error) throw new Error(error.message);

  let updated = 0;
  const stillKorean: string[] = [];

  for (const tool of tools ?? []) {
    const paidOnlyFeaturesEn = translateFeatureList(tool.paid_only_features ?? []);
    const freeLimitUnitEn =
      tool.free_limit_unit_en?.trim() ||
      translateFreeLimitUnit(tool.free_limit_unit) ||
      null;

    const needsPaidUpdate =
      (tool.paid_only_features?.length ?? 0) > 0 &&
      (!tool.paid_only_features_en?.length ||
        tool.paid_only_features_en.some(hasKorean) ||
        paidOnlyFeaturesEn.join('|') !== (tool.paid_only_features_en ?? []).join('|'));

    const needsUnitUpdate =
      tool.free_limit_unit &&
      !tool.free_limit_unit_en?.trim() &&
      freeLimitUnitEn;

    if (!needsPaidUpdate && !needsUnitUpdate) continue;

    const payload: {
      paid_only_features_en?: string[];
      free_limit_unit_en?: string | null;
    } = {};

    if (needsPaidUpdate) {
      payload.paid_only_features_en = paidOnlyFeaturesEn;
      if (paidOnlyFeaturesEn.some(hasKorean)) {
        stillKorean.push(tool.slug);
      }
    }

    if (needsUnitUpdate) {
      payload.free_limit_unit_en = freeLimitUnitEn;
    }

    const { error: updateError } = await supabase
      .from('tools')
      .update(payload)
      .eq('id', tool.id);

    if (updateError) {
      throw new Error(`${tool.slug}: ${updateError.message}`);
    }

    updated += 1;
  }

  console.log(`완료 — ${updated}건 업데이트`);
  if (stillKorean.length > 0) {
    console.log(`한글 잔존 ${stillKorean.length}건:`);
    for (const slug of stillKorean) {
      console.log(`  ${slug}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
