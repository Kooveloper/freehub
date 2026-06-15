import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';

import {
  excelRowToToolInput,
  parseToolExcelRows,
} from '../src/lib/admin/tool-excel';
import type { Category, SubCategory } from '../src/types/tool';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.');
  process.exit(1);
}

const fileArg = process.argv[2] ?? 'public/FreeHub_Admin_입력데이터.xlsx';
const filePath = resolve(process.cwd(), fileArg);

const FEATURE_PHRASES: Array<[RegExp, string]> = [
  [/배경\s*제거/g, 'Background removal'],
  [/이미지\s*편집/g, 'Image editing'],
  [/이미지\s*생성/g, 'Image generation'],
  [/텍스트→이미지/g, 'Text-to-image'],
  [/생성형\s*채우기/g, 'Generative fill'],
  [/텍스트\s*효과/g, 'Text effects'],
  [/노이즈\s*제거/g, 'Noise removal'],
  [/음성\s*품질\s*향상/g, 'Voice enhancement'],
  [/음성\s*전사/g, 'Speech transcription'],
  [/프리미엄\s*템플릿/g, 'Premium templates'],
  [/브랜드\s*키트/g, 'Brand kit'],
  [/크레딧\s*추가\s*구매/g, 'Additional credits'],
  [/상업적\s*사용/g, 'Commercial use'],
  [/고급\s*분석/g, 'Advanced analytics'],
  [/팀\s*협업/g, 'Team collaboration'],
  [/팀\s*기능/g, 'Team features'],
  [/이벤트\s*무제한/g, 'Unlimited event types'],
  [/예약\s*무제한/g, 'Unlimited bookings'],
  [/이메일\s*알림/g, 'Email notifications'],
  [/기본\s*분석/g, 'Basic analytics'],
  [/더\s*많은\s*채널/g, 'More channels'],
  [/수천\s*개\s*템플릿/g, 'Thousands of templates'],
  [/간단한\s*영상\s*편집/g, 'Simple video editing'],
  [/베타\s*종료\s*후\s*정책\s*변경\s*예정/g, 'Policy may change after beta'],
];

function translateFeaturePhrase(text: string): string {
  let result = text.trim();
  if (!result) return result;
  if (!/[가-힣]/.test(result)) return result;

  for (const [pattern, replacement] of FEATURE_PHRASES) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

function translateFeatureList(items: string[]): string[] {
  return items.map(translateFeaturePhrase).filter(Boolean);
}

async function main() {
  const supabase = createClient(supabaseUrl!, serviceKey!);

  const columnProbe = await supabase.from('tools').select('name_en').limit(1);
  if (columnProbe.error?.message?.includes('name_en')) {
    console.error(
      'tools 테이블에 i18n 컬럼이 없습니다. 먼저 Supabase SQL Editor에서 실행하세요:',
    );
    console.error(
      '  supabase/migrations/20250616_tools_i18n_columns.sql',
    );
    process.exit(1);
  }

  const [categoriesRes, subCategoriesRes, toolsRes] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order', { ascending: true }),
    supabase.from('sub_categories').select('*'),
    supabase.from('tools').select('id, slug'),
  ]);

  if (categoriesRes.error) throw new Error(categoriesRes.error.message);
  if (subCategoriesRes.error) throw new Error(subCategoriesRes.error.message);
  if (toolsRes.error) throw new Error(toolsRes.error.message);

  const categories = (categoriesRes.data ?? []) as Category[];
  const subCategories = (subCategoriesRes.data ?? []) as SubCategory[];
  const slugToId = new Map(
    (toolsRes.data ?? []).map((tool) => [tool.slug as string, tool.id as string]),
  );

  const buffer = readFileSync(filePath);
  const rows = parseToolExcelRows(buffer);

  console.log(`파일: ${filePath}`);
  console.log(`영문 백필 대상 행: ${rows.length}개`);

  let updated = 0;
  let skipped = 0;
  const failed: Array<{ slug: string; error: string }> = [];

  for (const row of rows) {
    const slug = String(row[2] ?? '').trim();
    const toolId = slugToId.get(slug);
    if (!toolId) {
      skipped += 1;
      continue;
    }

    const parsed = excelRowToToolInput(row, categories, subCategories);
    if ('error' in parsed) {
      failed.push({ slug, error: parsed.error });
      continue;
    }

    const input = parsed.input;
    const paidOnlyFeaturesEn =
      input.paid_only_features_en.length > 0
        ? input.paid_only_features_en
        : translateFeatureList(input.paid_only_features);

    const payload = {
      name_en: input.name_en.trim() || input.name.trim() || null,
      description_en: input.description_en.trim() || null,
      free_limit_unit_en: input.free_limit_unit_en?.trim() || null,
      free_description_en: input.free_description_en?.trim() || null,
      free_features_en: input.free_features_en,
      paid_only_features_en: paidOnlyFeaturesEn,
      tags_en: input.tags_en,
      tip_en: input.tip_en?.trim() || null,
    };

    const { error } = await supabase.from('tools').update(payload).eq('id', toolId);

    if (error) {
      failed.push({ slug, error: error.message });
      continue;
    }

    updated += 1;
  }

  console.log(`완료 — 영문 백필 ${updated}건, DB에 없는 슬러그 ${skipped}건, 실패 ${failed.length}건`);

  if (failed.length > 0) {
    for (const item of failed) {
      console.log(`  ${item.slug}: ${item.error}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
