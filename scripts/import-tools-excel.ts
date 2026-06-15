import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';

import {
  importToolsFromExcelRows,
  parseToolExcelRows,
} from '../src/lib/admin/tool-excel';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.');
  process.exit(1);
}

const fileArg = process.argv[2] ?? 'public/FreeHub_Admin_입력데이터.xlsx';
const filePath = resolve(process.cwd(), fileArg);

async function main() {
  const supabase = createClient(supabaseUrl!, serviceKey!);

  const [categoriesRes, subCategoriesRes] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order', { ascending: true }),
    supabase.from('sub_categories').select('*'),
  ]);

  if (categoriesRes.error) {
    throw new Error(categoriesRes.error.message);
  }
  if (subCategoriesRes.error) {
    throw new Error(subCategoriesRes.error.message);
  }

  const buffer = readFileSync(filePath);
  const rows = parseToolExcelRows(buffer);

  console.log(`파일: ${filePath}`);
  console.log(`가져올 행: ${rows.length}개`);

  const result = await importToolsFromExcelRows(
    rows,
    categoriesRes.data ?? [],
    subCategoriesRes.data ?? [],
    supabase,
    { includeI18n: true },
  );

  console.log(
    `완료 — 생성 ${result.created}, 수정 ${result.updated}, 실패 ${result.failed.length}`,
  );

  if (result.failed.length > 0) {
    console.log('실패 목록:');
    for (const failure of result.failed) {
      console.log(`  row ${failure.row} (${failure.slug}): ${failure.error}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
