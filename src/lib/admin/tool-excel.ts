import * as XLSX from 'xlsx';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  sanitizeToolForDb,
  validateToolInput,
  type ToolFormInput,
} from '@/lib/admin/tools';
import {
  normalizeCategoryAssignments,
  replaceToolCategoryAssignments,
} from '@/lib/tool-categories';
import type { Category, FreeLimitType, SubCategory, Tool } from '@/types/tool';

export const TOOL_EXCEL_SHEET_NAME = 'Admin 입력 데이터';

const SECTION_ROW: string[] = [
  '기본 정보',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '무료 정보',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '추가 정보',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '관리',
  '',
];

export const TOOL_EXCEL_HEADERS: string[] = [
  '서비스명 (한국어)*',
  '서비스명 (English)',
  '슬러그*',
  '대카테고리*',
  '서브카테고리',
  '홈페이지 URL*',
  '설명 (한국어)',
  '설명 (English)',
  '무료 플랜 존재\n(Y/N)*',
  '한도 유형\n(일별/월별/총량/무제한)',
  '한도 수량',
  '단위 (한국어)',
  '단위 (English)',
  '무료 상세 설명 (한국어)',
  '무료 상세 설명 (English)',
  '무료 플랜 직접 링크',
  '신용카드 필요\n(Y/N)',
  '가입 방법',
  '무료 기능 (한국어)',
  '무료 기능 (English)',
  '유료 전용 기능 (한국어)',
  '사용 팁 (한국어)',
  '사용 팁 (English)',
  '태그 (한국어)',
  '태그 (English)',
  '검증 완료 (Y/N)',
  '한국 서비스 (Y/N)',
];

const LIMIT_TYPE_TO_KO: Record<FreeLimitType, string> = {
  daily: '일별',
  monthly: '월별',
  total: '총량',
  unlimited: '무제한',
};

const LIMIT_TYPE_FROM_KO: Record<string, FreeLimitType> = {
  일별: 'daily',
  주별: 'monthly',
  월별: 'monthly',
  총량: 'total',
  무제한: 'unlimited',
};

export interface ToolExcelImportFailure {
  row: number;
  slug: string;
  error: string;
}

export interface ToolExcelImportResult {
  created: number;
  updated: number;
  skipped: number;
  failed: ToolExcelImportFailure[];
  total: number;
}

function normalizeCategoryLabel(value: string): string {
  return value.replace(/^AI\s+/i, '').trim();
}

function joinList(values: string[] | null | undefined): string {
  return (values ?? []).join(', ');
}

function splitList(value: unknown): string[] {
  const raw = String(value ?? '').trim();
  if (!raw) return [];
  return raw
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatYn(value: boolean): string {
  return value ? 'Y' : 'N';
}

function parseYn(value: unknown, required = false): boolean | null {
  const raw = String(value ?? '').trim().toUpperCase();
  if (!raw) return required ? null : false;
  if (['Y', 'YES', 'TRUE', '1', '예'].includes(raw)) return true;
  if (['N', 'NO', 'FALSE', '0', '아니오'].includes(raw)) return false;
  return null;
}

function parseLimitType(value: unknown): FreeLimitType | null {
  const raw = String(value ?? '').trim();
  if (!raw) return 'unlimited';
  return LIMIT_TYPE_FROM_KO[raw] ?? null;
}

function parseAmount(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '')
    .replace(/^ai/, '');
}

const CATEGORY_LABEL_ALIASES: Record<string, string[]> = {
  음성: ['오디오', 'audio'],
  오디오: ['음성', 'audio'],
};

export function resolveCategorySlug(
  input: string,
  categories: Category[],
): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const normalized = normalizeCategoryLabel(trimmed);
  const normalizedKey = normalizeLabel(trimmed);

  const exact = categories.find(
    (category) =>
      category.slug === trimmed ||
      category.name === trimmed ||
      normalizeCategoryLabel(category.name) === normalized ||
      normalizeLabel(category.name) === normalizedKey ||
      normalizeLabel(category.slug) === normalizedKey,
  );
  if (exact) return exact.slug;

  const aliases = CATEGORY_LABEL_ALIASES[trimmed] ?? [];
  for (const alias of aliases) {
    const match = categories.find(
      (category) =>
        category.name === alias ||
        category.slug === alias ||
        normalizeLabel(category.name) === normalizeLabel(alias),
    );
    if (match) return match.slug;
  }

  return null;
}

export function resolveSubCategorySlug(
  input: string,
  categorySlug: string,
  subCategories: SubCategory[],
): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const candidates = subCategories.filter(
    (sub) => sub.category_slug === categorySlug,
  );

  const normalizedInput = normalizeLabel(trimmed);

  const exact = candidates.find(
    (sub) =>
      sub.slug === trimmed ||
      sub.name === trimmed ||
      normalizeLabel(sub.name) === normalizedInput ||
      normalizeLabel(sub.slug) === normalizedInput,
  );
  if (exact) return exact.slug;

  const partial = candidates.find((sub) => {
    const normalizedName = normalizeLabel(sub.name);
    return (
      normalizedInput.includes(normalizedName) ||
      normalizedName.includes(normalizedInput)
    );
  });
  if (partial) return partial.slug;

  const keywordMatches: Record<string, string[]> = {
    이미지에셋: ['에셋'],
    업스케일링: ['업스케일'],
    ai챗봇: ['챗봇'],
    글쓰기카피: ['글쓰기'],
    맞춤법교정: ['맞춤법'],
    자막생성: ['자막'],
    쇼츠릴스: ['숏폼'],
    온라인ide: ['ide'],
    db관리: ['db'],
    프레젠테이션: ['ppt'],
    디자인에셋: ['에셋'],
    색상폰트: ['컬러'],
    sns예약: ['sns'],
    노트문서: ['노트'],
    프로젝트관리: ['pm'],
    회의일정: ['회의'],
  };

  const keywords = keywordMatches[normalizedInput];
  if (keywords) {
    const match = candidates.find((sub) =>
      keywords.some((keyword) => normalizeLabel(sub.name).includes(keyword)),
    );
    if (match) return match.slug;
  }

  return null;
}

function getCategoryName(slug: string, categories: Category[]): string {
  return categories.find((category) => category.slug === slug)?.name ?? slug;
}

function getSubCategoryName(
  slug: string | null | undefined,
  subCategories: SubCategory[],
): string {
  if (!slug) return '';
  return subCategories.find((sub) => sub.slug === slug)?.name ?? slug;
}

export function toolToExcelRow(
  tool: Tool,
  categories: Category[],
  subCategories: SubCategory[],
): (string | number)[] {
  return [
    tool.name,
    tool.name_en ?? '',
    tool.slug,
    getCategoryName(tool.category_slug, categories),
    getSubCategoryName(tool.sub_category, subCategories),
    tool.homepage_url,
    tool.description,
    tool.description_en ?? '',
    formatYn(tool.free_plan_exists),
    tool.free_plan_exists
      ? LIMIT_TYPE_TO_KO[tool.free_limit_type]
      : '무제한',
    tool.free_limit_amount ?? '',
    tool.free_limit_unit ?? '',
    tool.free_limit_unit_en ?? '',
    tool.free_description ?? '',
    tool.free_description_en ?? '',
    tool.free_plan_url ?? '',
    formatYn(tool.requires_credit_card),
    joinList(tool.signup_methods),
    joinList(tool.free_features),
    joinList(tool.free_features_en),
    joinList(tool.paid_only_features),
    tool.tip ?? '',
    tool.tip_en ?? '',
    joinList(tool.tags),
    joinList(tool.tags_en),
    formatYn(tool.is_verified),
    formatYn(tool.is_sponsored),
  ];
}

export function buildToolsExcelBuffer(
  tools: Tool[],
  categories: Category[],
  subCategories: SubCategory[],
): Buffer {
  const rows: (string | number)[][] = [
    SECTION_ROW,
    TOOL_EXCEL_HEADERS,
    ...tools.map((tool) => toolToExcelRow(tool, categories, subCategories)),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = TOOL_EXCEL_HEADERS.map(() => ({ wch: 24 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, TOOL_EXCEL_SHEET_NAME);

  return Buffer.from(
    XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
  );
}

function isHeaderRow(row: unknown[]): boolean {
  return String(row[2] ?? '').trim() === '슬러그*';
}

function isSectionRow(row: unknown[]): boolean {
  return String(row[0] ?? '').trim() === '기본 정보';
}

export function parseToolExcelRows(buffer: Buffer): unknown[][] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName =
    workbook.SheetNames.find((name) => name === TOOL_EXCEL_SHEET_NAME) ??
    workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
  }) as unknown[][];

  return rows.filter((row) => {
    if (!Array.isArray(row)) return false;
    if (isSectionRow(row) || isHeaderRow(row)) return false;
    const slug = String(row[2] ?? '').trim();
    const name = String(row[0] ?? '').trim();
    return Boolean(slug || name);
  });
}

export function excelRowToToolInput(
  row: unknown[],
  categories: Category[],
  subCategories: SubCategory[],
): { input: ToolFormInput } | { error: string } {
  const categoryName = String(row[3] ?? '').trim();
  const categorySlug = resolveCategorySlug(categoryName, categories);
  if (!categorySlug) {
    return {
      error: `대카테고리를 찾을 수 없습니다: "${categoryName}"`,
    };
  }

  const subCategoryName = String(row[4] ?? '').trim();
  let subCategorySlug: string | null = null;
  if (subCategoryName) {
    subCategorySlug = resolveSubCategorySlug(
      subCategoryName,
      categorySlug,
      subCategories,
    );
    if (!subCategorySlug) {
      return {
        error: `서브카테고리를 찾을 수 없습니다: "${subCategoryName}"`,
      };
    }
  }

  const freePlanExists = parseYn(row[8], true);
  if (freePlanExists === null) {
    return { error: '무료 플랜 존재(Y/N) 값이 올바르지 않습니다.' };
  }

  let limitType = parseLimitType(row[9]);
  if (!limitType) {
    return { error: '한도 유형이 올바르지 않습니다. (일별/월별/총량/무제한)' };
  }

  let freeLimitAmount = parseAmount(row[10]);
  let freeLimitUnit = String(row[11] ?? '').trim() || null;
  const freeLimitUnitEn = String(row[12] ?? '').trim() || null;

  if (
    freePlanExists &&
    limitType !== 'unlimited' &&
    (freeLimitAmount === null || !freeLimitUnit)
  ) {
    limitType = 'unlimited';
    freeLimitAmount = null;
    freeLimitUnit = null;
  }

  const requiresCreditCard = parseYn(row[16]);
  if (requiresCreditCard === null) {
    return { error: '신용카드 필요(Y/N) 값이 올바르지 않습니다.' };
  }

  const isVerified = parseYn(row[25]);
  if (isVerified === null) {
    return { error: '검증 완료(Y/N) 값이 올바르지 않습니다.' };
  }

  const isSponsored = parseYn(row[26]);
  if (isSponsored === null) {
    return { error: '한국 서비스(Y/N) 값이 올바르지 않습니다.' };
  }

  const candidate = {
    slug: String(row[2] ?? '').trim(),
    name: String(row[0] ?? '').trim(),
    name_en: String(row[1] ?? '').trim(),
    category_slug: categorySlug,
    sub_category: subCategorySlug,
    logo_url: null,
    homepage_url: String(row[5] ?? '').trim(),
    description: String(row[6] ?? '').trim(),
    description_en: String(row[7] ?? '').trim(),
    free_plan_exists: freePlanExists,
    free_limit_type: limitType,
    free_limit_amount: freeLimitAmount,
    free_limit_unit: freeLimitUnit,
    free_limit_unit_en: freeLimitUnitEn,
    free_description: String(row[13] ?? '').trim() || null,
    free_description_en: String(row[14] ?? '').trim() || null,
    free_plan_url: String(row[15] ?? '').trim() || null,
    requires_credit_card: requiresCreditCard,
    signup_methods: splitList(row[17]),
    free_features: splitList(row[18]),
    free_features_en: splitList(row[19]),
    paid_only_features: splitList(row[20]),
    paid_only_features_en: [],
    tags: splitList(row[23]),
    tags_en: splitList(row[24]),
    tip: String(row[21] ?? '').trim() || null,
    tip_en: String(row[22] ?? '').trim() || null,
    is_sponsored: isSponsored,
    is_verified: isVerified,
  };

  const input = validateToolInput(candidate);
  if (!input) {
    return { error: '필수 항목 또는 형식이 올바르지 않습니다.' };
  }

  return { input };
}


export async function importToolsFromExcelRows(
  rows: unknown[][],
  categories: Category[],
  subCategories: SubCategory[],
  supabase: SupabaseClient,
  options?: { includeI18n?: boolean },
): Promise<ToolExcelImportResult> {
  const includeI18n = options?.includeI18n ?? false;
  const result: ToolExcelImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    failed: [],
    total: rows.length,
  };

  const { data: existingTools, error: existingError } = await supabase
    .from('tools')
    .select('id, slug, is_verified, verified_date');

  if (existingError) {
    throw new Error(`기존 툴 조회 실패: ${existingError.message}`);
  }

  const slugToExisting = new Map(
    (existingTools ?? []).map((tool) => [tool.slug, tool]),
  );

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const rowNumber = index + 3;
    const slug = String(row[2] ?? '').trim();

    const parsed = excelRowToToolInput(row, categories, subCategories);
    if ('error' in parsed) {
      result.failed.push({
        row: rowNumber,
        slug: slug || `row-${rowNumber}`,
        error: parsed.error,
      });
      continue;
    }

    const input = parsed.input;
    const now = new Date().toISOString();
    const payload = {
      ...sanitizeToolForDb(input, { includeI18n }),
      last_edited_at: now,
    };

    const existing = slugToExisting.get(input.slug);

    if (existing) {
      let verifiedDate: string | null = existing.verified_date ?? null;
      if (input.is_verified && !existing.is_verified) {
        verifiedDate = now;
      } else if (!input.is_verified) {
        verifiedDate = null;
      }

      const { error } = await supabase
        .from('tools')
        .update({
          ...payload,
          verified_date: verifiedDate,
        })
        .eq('id', existing.id);

      if (error) {
        result.failed.push({
          row: rowNumber,
          slug: input.slug,
          error: error.message,
        });
        continue;
      }

      try {
        await replaceToolCategoryAssignments(
          supabase,
          existing.id,
          input.category_assignments,
        );
      } catch (assignmentError) {
        result.failed.push({
          row: rowNumber,
          slug: input.slug,
          error:
            assignmentError instanceof Error
              ? assignmentError.message
              : '분류 저장 실패',
        });
        continue;
      }

      result.updated += 1;
      continue;
    }

    const { data: createdTool, error } = await supabase
      .from('tools')
      .insert({
        ...payload,
        verified_date: input.is_verified ? now : null,
      })
      .select('id')
      .single();

    if (error || !createdTool) {
      result.failed.push({
        row: rowNumber,
        slug: input.slug,
        error: error?.message ?? '툴 생성 실패',
      });
      continue;
    }

    try {
      await replaceToolCategoryAssignments(
        supabase,
        createdTool.id as string,
        input.category_assignments,
      );
    } catch (assignmentError) {
      await supabase.from('tools').delete().eq('id', createdTool.id);
      result.failed.push({
        row: rowNumber,
        slug: input.slug,
        error:
          assignmentError instanceof Error
            ? assignmentError.message
            : '분류 저장 실패',
      });
      continue;
    }

    result.created += 1;
    slugToExisting.set(input.slug, {
      id: createdTool.id as string,
      slug: input.slug,
      is_verified: input.is_verified,
      verified_date: input.is_verified ? now : null,
    });
  }

  return result;
}
