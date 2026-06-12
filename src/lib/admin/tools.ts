import type { FreeLimitType } from '@/types/tool';

export const SLUG_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export const FREE_LIMIT_TYPE_LABELS: Record<FreeLimitType, string> = {
  daily: '일별',
  monthly: '월별',
  total: '총량',
  unlimited: '무제한',
};

export interface ToolFormInput {
  slug: string;
  name: string;
  name_en: string;
  category_slug: string;
  sub_category: string | null;
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

  if (!slug || !SLUG_PATTERN.test(slug)) return null;
  if (!name || name.length > 100) return null;
  if (nameEn.length > 100) return null;
  if (!categorySlug) return null;
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
  ];
  if (!validLimitTypes.includes(freeLimitType)) return null;

  let freeLimitAmount: number | null = null;
  let freeLimitUnit: string | null = null;
  let freeLimitUnitEn: string | null = null;
  let resolvedLimitType = freeLimitType;

  if (!freePlanExists) {
    resolvedLimitType = 'unlimited';
  } else if (freeLimitType === 'unlimited') {
    resolvedLimitType = 'unlimited';
  } else {
    const amount = Number(input.free_limit_amount);
    const unit = String(input.free_limit_unit ?? '').trim();
    const unitEn = String(input.free_limit_unit_en ?? '').trim();

    if (!Number.isFinite(amount) || amount < 0) return null;
    if (!unit || unit.length > 20) return null;
    if (unitEn.length > 20) return null;

    freeLimitAmount = amount;
    freeLimitUnit = unit;
    freeLimitUnitEn = unitEn || null;
  }

  return {
    slug,
    name,
    name_en: nameEn,
    category_slug: categorySlug,
    sub_category: subCategoryRaw || null,
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
    requires_credit_card: false,
    free_features: freeFeatures,
    free_features_en: freeFeaturesEn,
    paid_only_features: paidOnlyFeatures,
    paid_only_features_en: paidOnlyFeaturesEn,
    signup_methods: [],
    tags,
    tags_en: tagsEn,
    tip: tipRaw || null,
    tip_en: tipEnRaw || null,
    is_sponsored: isSponsored,
    is_verified: isVerified,
  };
}

/** API 저장 시 빈 영문 필드는 null로 변환 */
export function sanitizeToolForDb(input: ToolFormInput) {
  return {
    ...input,
    sub_category: input.sub_category?.trim() || null,
    name_en: input.name_en.trim() || null,
    description_en: input.description_en.trim() || null,
    free_limit_unit_en: input.free_limit_unit_en?.trim() || null,
    free_description_en: input.free_description_en?.trim() || null,
    tip_en: input.tip_en?.trim() || null,
  };
}

export function toolToFormInput(tool: {
  slug: string;
  name: string;
  name_en?: string | null;
  category_slug: string;
  sub_category?: string | null;
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
  return {
    slug: tool.slug,
    name: tool.name,
    name_en: tool.name_en ?? '',
    category_slug: tool.category_slug,
    sub_category: tool.sub_category ?? null,
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
