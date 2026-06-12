export const LIMIT_FILTER_OPTIONS = [
  { key: 'daily', labelKo: '일별 한도', labelEn: 'Daily limit' },
  { key: 'monthly', labelKo: '월별 한도', labelEn: 'Monthly limit' },
  { key: 'unlimited', labelKo: '무제한', labelEn: 'Unlimited' },
] as const;

export const SORT_OPTIONS = [
  { key: 'popular' as const, labelKo: '인기순', labelEn: 'Popular' },
  { key: 'updated' as const, labelKo: '최근 업데이트', labelEn: 'Recently updated' },
  { key: 'name' as const, labelKo: '이름순', labelEn: 'Name' },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]['key'];

export function getSortLabel(sort: SortOption, locale: 'ko' | 'en' = 'ko') {
  const option = SORT_OPTIONS.find((item) => item.key === sort);
  if (!option) return sort;
  return locale === 'en' ? option.labelEn : option.labelKo;
}

export function getLimitFilterLabel(key: string, locale: 'ko' | 'en' = 'ko') {
  const option = LIMIT_FILTER_OPTIONS.find((item) => item.key === key);
  if (!option) return key;
  return locale === 'en' ? option.labelEn : option.labelKo;
}
