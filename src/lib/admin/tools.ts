import {
  getPrimaryAssignment,
  normalizeCategoryAssignments,
  type ToolCategoryAssignmentInput,
} from '@/lib/tool-categories';
import type { FreeLimitType, ToolCategoryAssignment } from '@/types/tool';

export const SLUG_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const FREE_LIMIT_UNIT_MAX_LENGTH = 80;

export const FREE_LIMIT_TYPE_LABELS: Record<FreeLimitType, string> = {
  daily: '일별',
  monthly: '월별',
  total: '총량',
  unlimited: '무제한',
  other: '기타',
};

export interface ToolFormInput {
  slug: string;
  name: string;
  name_en: string;
  category_slug: string;
  sub_category: string | null;
  category_assignments: ToolCategoryAssignmentInput[];
  logo_url: string | null;
  homepage_url: string;
  description: string;
  description_en: string;
  free_plan_exists: boolean;
  free_limit_type: FreeLimitType;
  free_limit_amount: number | null;
  free_limit_unit: string | null;
  free_limit_unit_en: string | null;
  free_description: string | null;
  free_description_en: string | null;
  free_plan_url: string | null;
  requires_credit_card: boolean;
  free_features: string[];
  free_features_en: string[];
  paid_only_features: string[];
  paid_only_features_en: string[];
  signup_methods: string[];
  tags: string[];
  tags_en: string[];
  tip: string | null;
  tip_en: string | null;
  is_sponsored: boolean;
  is_verified: boolean;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);
  return items;
}

/** 서비스명에서 슬러그 자동 생성 (영문·숫자만) */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseCategoryAssignments(
  input: Record<string, unknown>,
  fallbackCategory: string,
  fallbackSub: string | null,
): ToolCategoryAssignmentInput[] | null {
  const raw = input.category_assignments;
  if (Array.isArray(raw) && raw.length > 0) {
    const parsed = raw
      .map((row) => {
        if (!row || typeof row !== 'object') return null;
        const record = row as Record<string, unknown>;
        const categorySlug = String(record.category_slug ?? '').trim();
        const subCategoryRaw = String(record.sub_category ?? '').trim();
        if (!categorySlug) return null;
        return {
          category_slug: categorySlug,
          sub_category: subCategoryRaw || null,
        };
      })
      .filter((row): row is ToolCategoryAssignmentInput => row != null);

    const normalized = normalizeCategoryAssignments(parsed);
    if (normalized.length === 0) return null;
    return normalized;
  }

  if (!fallbackCategory) return null;
  return normalizeCategoryAssignments([
    { category_slug: fallbackCategory, sub_category: fallbackSub },
  ]);
}

export function validateToolInput(body: unknown): ToolFormInput | null {
  if (!body || typeof body !== 'object') return null;

  const input = body as Record<string, unknown>;
  const slug = String(input.slug ?? '').trim();
  const name = String(input.name ?? '').trim();
  const categorySlug = String(input.category_slug ?? '').trim();
  const subCategoryRaw = String(input.sub_category ?? '').trim();
  const homepageUrl = String(input.homepage_url ?? '').trim();
  const description = String(input.description ?? '').trim();
  const descriptionEn = String(input.description_en ?? '').trim();
  const nameEn = String(input.name_en ?? '').trim();
  const logoUrlRaw = String(input.logo_url ?? '').trim();
  const freePlanUrlRaw = String(input.free_plan_url ?? '').trim();
  const freeDescriptionRaw = String(input.free_description ?? '').trim();
  const freeDescriptionEnRaw = String(input.free_description_en ?? '').trim();
  const tipRaw = String(input.tip ?? '').trim();
  const tipEnRaw = String(input.tip_en ?? '').trim();
  const freePlanExists = Boolean(input.free_plan_exists);
  const isSponsored = Boolean(input.is_sponsored);
  const isVerified = Boolean(input.is_verified);

  const freeLimitType = String(input.free_limit_type ?? '') as FreeLimitType;
  const freeFeatures = parseStringArray(input.free_features);
  const freeFeaturesEn = parseStringArray(input.free_features_en) ?? [];
  const paidOnlyFeatures = parseStringArray(input.paid_only_features);
  const paidOnlyFeaturesEn = parseStringArray(input.paid_only_features_en) ?? [];
  const tags = parseStringArray(input.tags);
  const tagsEn = parseStringArray(input.tags_en) ?? [];
  const signupMethods = parseStringArray(input.signup_methods) ?? [];
  const requiresCreditCard = Boolean(input.requires_credit_card);

  if (!slug || !SLUG_PATTERN.test(slug)) return null;
  if (!name || name.length > 100) return null;
  if (nameEn.length > 100) return null;

  const categoryAssignments = parseCategoryAssignments(
    input,
    categorySlug,
    subCategoryRaw || null,
  );
  if (!categoryAssignments) return null;

  const primary = getPrimaryAssignment(categoryAssignments);

  if (!homepageUrl || !isValidUrl(homepageUrl)) return null;
  if (!description || description.length > 2000) return null;
  if (descriptionEn.length > 2000) return null;

  if (logoUrlRaw && !isValidUrl(logoUrlRaw)) return null;
  if (freePlanUrlRaw && !isValidUrl(freePlanUrlRaw)) return null;
  if (!freeFeatures || !paidOnlyFeatures || !tags) {
    return null;
  }

  const validLimitTypes: FreeLimitType[] = [
    'daily',
    'monthly',
    'total',
    'unlimited',
    'other',
  ];
  if (!validLimitTypes.includes(freeLimitType)) return null;

  let freeLimitAmount: number | null = null;
  let freeLimitUnit: string | null = null;
  let freeLimitUnitEn: string | null = null;
  let resolvedLimitType = freeLimitType;

  if (!freePlanExists) {
    resolvedLimitType = 'unlimited';
  } else if (freeLimitType === 'unlimited' || freeLimitType === 'other') {
    resolvedLimitType = freeLimitType;
  } else {
    const amount = Number(input.free_limit_amount);
    const unit = String(input.free_limit_unit ?? '').trim();
    const unitEn = String(input.free_limit_unit_en ?? '').trim();

    if (!Number.isFinite(amount) || amount < 0) return null;
    if (!unit || unit.length > FREE_LIMIT_UNIT_MAX_LENGTH) return null;
    if (unitEn.length > FREE_LIMIT_UNIT_MAX_LENGTH) return null;

    freeLimitAmount = amount;
    freeLimitUnit = unit;
    freeLimitUnitEn = unitEn || null;
  }

  return {
    slug,
    name,
    name_en: nameEn,
    category_slug: primary.category_slug,
    sub_category: primary.sub_category,
    category_assignments: categoryAssignments,
    logo_url: logoUrlRaw || null,
    homepage_url: homepageUrl,
    description,
    description_en: descriptionEn,
    free_plan_exists: freePlanExists,
    free_limit_type: resolvedLimitType,
    free_limit_amount: freeLimitAmount,
    free_limit_unit: freeLimitUnit,
    free_limit_unit_en: freeLimitUnitEn,
    free_description: freeDescriptionRaw || null,
    free_description_en: freeDescriptionEnRaw || null,
    free_plan_url: freePlanUrlRaw || null,
    requires_credit_card: requiresCreditCard,
    free_features: freeFeatures,
    free_features_en: freeFeaturesEn,
    paid_only_features: paidOnlyFeatures,
    paid_only_features_en: paidOnlyFeaturesEn,
    signup_methods: signupMethods,
    tags,
    tags_en: tagsEn,
    tip: tipRaw || null,
    tip_en: tipEnRaw || null,
    is_sponsored: isSponsored,
    is_verified: isVerified,
  };
}

/** API 저장 시 빈 영문 필드는 null로 변환 */
export function sanitizeToolForDb(
  input: ToolFormInput,
  options?: { includeI18n?: boolean },
) {
  const includeI18n = options?.includeI18n ?? true;
  const base = {
    slug: input.slug,
    name: input.name,
    category_slug: input.category_slug,
    sub_category: input.sub_category?.trim() || null,
    logo_url: input.logo_url,
    homepage_url: input.homepage_url,
    description: input.description,
    free_plan_exists: input.free_plan_exists,
    free_limit_type: input.free_limit_type,
    free_limit_amount: input.free_limit_amount,
    free_limit_unit: input.free_limit_unit,
    free_description: input.free_description,
    free_plan_url: input.free_plan_url,
    requires_credit_card: input.requires_credit_card,
    free_features: input.free_features,
    paid_only_features: input.paid_only_features,
    signup_methods: input.signup_methods,
    tags: input.tags,
    tip: input.tip,
    is_sponsored: input.is_sponsored,
    is_verified: input.is_verified,
  };

  if (!includeI18n) {
    return base;
  }

  return {
    ...base,
    name_en: input.name_en.trim() || null,
    description_en: input.description_en.trim() || null,
    free_limit_unit_en: input.free_limit_unit_en?.trim() || null,
    free_description_en: input.free_description_en?.trim() || null,
    free_features_en: input.free_features_en,
    paid_only_features_en: input.paid_only_features_en,
    tags_en: input.tags_en,
    tip_en: input.tip_en?.trim() || null,
  };
}

export function toolToFormInput(tool: {
  slug: string;
  name: string;
  name_en?: string | null;
  category_slug: string;
  sub_category?: string | null;
  category_assignments?: ToolCategoryAssignment[];
  logo_url: string | null;
  homepage_url: string;
  description: string;
  description_en?: string | null;
  free_plan_exists: boolean;
  free_limit_type: FreeLimitType;
  free_limit_amount: number | null;
  free_limit_unit: string | null;
  free_limit_unit_en?: string | null;
  free_description: string | null;
  free_description_en?: string | null;
  free_plan_url: string | null;
  requires_credit_card: boolean;
  free_features: string[];
  free_features_en?: string[];
  paid_only_features: string[];
  paid_only_features_en?: string[];
  signup_methods: string[];
  tags: string[];
  tags_en?: string[];
  tip: string | null;
  tip_en?: string | null;
  is_sponsored: boolean;
  is_verified: boolean;
}): ToolFormInput {
  const assignments =
    tool.category_assignments?.map((row) => ({
      category_slug: row.category_slug,
      sub_category: row.sub_category,
    })) ??
    normalizeCategoryAssignments([
      {
        category_slug: tool.category_slug,
        sub_category: tool.sub_category ?? null,
      },
    ]);

  const primary = getPrimaryAssignment(assignments);

  return {
    slug: tool.slug,
    name: tool.name,
    name_en: tool.name_en ?? '',
    category_slug: primary.category_slug,
    sub_category: primary.sub_category,
    category_assignments: assignments,
    logo_url: tool.logo_url,
    homepage_url: tool.homepage_url,
    description: tool.description,
    description_en: tool.description_en ?? '',
    free_plan_exists: tool.free_plan_exists,
    free_limit_type: tool.free_limit_type,
    free_limit_amount: tool.free_limit_amount,
    free_limit_unit: tool.free_limit_unit ?? '',
    free_limit_unit_en: tool.free_limit_unit_en ?? '',
    free_description: tool.free_description,
    free_description_en: tool.free_description_en ?? '',
    free_plan_url: tool.free_plan_url,
    requires_credit_card: tool.requires_credit_card,
    free_features: tool.free_features ?? [],
    free_features_en: tool.free_features_en ?? [],
    paid_only_features: tool.paid_only_features ?? [],
    paid_only_features_en: tool.paid_only_features_en ?? [],
    signup_methods: tool.signup_methods ?? [],
    tags: tool.tags ?? [],
    tags_en: tool.tags_en ?? [],
    tip: tool.tip,
    tip_en: tool.tip_en ?? '',
    is_sponsored: tool.is_sponsored,
    is_verified: tool.is_verified,
  };
}
