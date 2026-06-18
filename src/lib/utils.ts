import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Locale } from '@/i18n/config';
import { createTranslator } from '@/i18n';
import type { FreeLimitType, Tool } from '@/types/tool';

/** Tailwind 클래스 병합 (조건부 클래스 + 중복 제거) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** ISO 날짜 문자열을 로케일 형식으로 포맷 */
export function formatDate(date: string, locale: Locale = 'ko'): string {
  const dateLocale = locale === 'en' ? 'en-US' : 'ko-KR';
  return new Date(date).toLocaleDateString(dateLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** 무료 플랜 한도를 로케일별 문구로 변환 */
export function formatFreeLimit(
  type: FreeLimitType,
  amount: number | null,
  unit: string | null,
  locale: Locale = 'ko',
): string {
  const t = createTranslator(locale);
  const numberLocale = locale === 'en' ? 'en-US' : 'ko-KR';

  if (type === 'unlimited') {
    return t('freeLimit.unlimited');
  }

  const formattedAmount =
    amount != null ? amount.toLocaleString(numberLocale) : '';
  const unitStr = unit ?? '';

  switch (type) {
    case 'daily':
      return t('freeLimit.daily', { amount: formattedAmount, unit: unitStr });
    case 'monthly':
      return t('freeLimit.monthly', { amount: formattedAmount, unit: unitStr });
    case 'total':
      return t('freeLimit.total', { amount: formattedAmount, unit: unitStr });
    case 'other':
      return t('freeLimit.other');
    default:
      return t('freeLimit.unlimited');
  }
}

/**
 * 즐겨찾기 툴을 맨 앞으로, 나머지는 view_count 내림차순 정렬
 * @param favoriteIds 즐겨찾기 순서를 유지할 ID 배열
 */
export function sortWithFavorites(
  tools: Tool[],
  favoriteIds: string[],
): Tool[] {
  const favoriteSet = new Set(favoriteIds);
  const favoriteMap = new Map(tools.map((tool) => [tool.id, tool]));

  const favorites = favoriteIds
    .map((id) => favoriteMap.get(id))
    .filter((tool): tool is Tool => tool != null);

  const others = tools
    .filter((tool) => !favoriteSet.has(tool.id))
    .sort((a, b) => b.view_count - a.view_count);

  return [...favorites, ...others];
}
