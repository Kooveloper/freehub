import type { Locale } from '@/i18n/config';

import { getSiteSettings } from '@/lib/site-settings';

export interface SiteSeoBase {
  title: string;
  description: string;
}

const FALLBACK_SEO: Record<Locale, SiteSeoBase> = {
  ko: {
    title: '모든 무료 서비스를 한곳에서',
    description:
      'Chat GPT, Notion부터 다양한 무료 서비스를 한곳에서, 무료플랜 한도 기능을 비교하고 필요한 서비스를 찾아보세요.',
  },
  en: {
    title: 'All free services in one place',
    description:
      'From ChatGPT and Notion to many free services in one place — compare free plan limits and features, and find what you need.',
  },
};

/** admin head HTML에서 title·description 추출 */
export function parseHeadSeo(html: string | null): Partial<SiteSeoBase> {
  if (!html?.trim()) return {};

  const result: Partial<SiteSeoBase> = {};

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]?.trim()) {
    result.title = titleMatch[1].trim();
  }

  const descMatch =
    html.match(
      /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*\/?>/i,
    ) ??
    html.match(
      /<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*\/?>/i,
    );

  if (descMatch?.[1]?.trim()) {
    result.description = descMatch[1].trim();
  }

  return result;
}

export async function getSiteSeoBase(locale: Locale): Promise<SiteSeoBase> {
  const fallback = FALLBACK_SEO[locale];
  const settings = await getSiteSettings();
  const parsed = parseHeadSeo(settings.extraHeadHtml);

  return {
    title: parsed.title || fallback.title,
    description: parsed.description || fallback.description,
  };
}

export function buildCategorySeoCopy(
  base: SiteSeoBase,
  categoryName: string,
  locale: Locale,
): SiteSeoBase {
  if (locale === 'en') {
    return {
      title: `${categoryName} free services | ${base.title}`,
      description: `Compare ${categoryName} free services in one place. ${base.description}`,
    };
  }

  return {
    title: `${categoryName} 무료 서비스 | ${base.title}`,
    description: `${categoryName} 무료 서비스를 한곳에서 비교하세요. ${base.description}`,
  };
}

export function buildBlogListSeoCopy(
  base: SiteSeoBase,
  locale: Locale,
): SiteSeoBase {
  if (locale === 'en') {
    return {
      title: `Blog | ${base.title}`,
      description: `Guides and tips for free services. ${base.description}`,
    };
  }

  return {
    title: `블로그 | ${base.title}`,
    description: `무료 서비스 활용법과 최신 정보. ${base.description}`,
  };
}

export function buildCompareSeoCopy(
  base: SiteSeoBase,
  locale: Locale,
): SiteSeoBase {
  if (locale === 'en') {
    return {
      title: `Compare services | ${base.title}`,
      description: `Compare free services side by side. ${base.description}`,
    };
  }

  return {
    title: `서비스 비교 | ${base.title}`,
    description: `무료 서비스를 나란히 비교하세요. ${base.description}`,
  };
}

export function buildBlogPostSeoCopy(
  base: SiteSeoBase,
  postTitle: string,
  metaDescription: string | null,
  locale: Locale,
): SiteSeoBase {
  const description =
    metaDescription?.trim() ||
    (locale === 'en'
      ? `${postTitle}. ${base.description}`
      : `${postTitle}. ${base.description}`);

  return {
    title: `${postTitle} | ${base.title}`,
    description,
  };
}

export function buildHomeSeoKeywords(locale: Locale): string[] {
  if (locale === 'en') {
    return [
      'FreeHub',
      'free services',
      'free plan',
      'ChatGPT',
      'Notion',
      'compare limits',
    ];
  }

  return [
    'FreeHub',
    '무료 서비스',
    '무료 플랜',
    '무료 한도',
    'ChatGPT',
    'Notion',
    '서비스 비교',
  ];
}

export function buildCategorySeoKeywords(
  categoryName: string,
  locale: Locale,
): string[] {
  if (locale === 'en') {
    return [
      categoryName,
      `${categoryName} free services`,
      'free plan',
      'FreeHub',
    ];
  }

  return [
    categoryName,
    `${categoryName} 무료`,
    `${categoryName} 무료 서비스`,
    '무료 플랜',
    '무료 한도',
    'FreeHub',
  ];
}

export function buildBlogListSeoKeywords(locale: Locale): string[] {
  if (locale === 'en') {
    return ['FreeHub', 'blog', 'free services', 'guides', 'tips'];
  }

  return ['FreeHub', '블로그', '무료 서비스', '활용법', '무료 플랜'];
}

export function buildCompareSeoKeywords(locale: Locale): string[] {
  if (locale === 'en') {
    return [
      'FreeHub',
      'compare services',
      'free plan comparison',
      'free services',
    ];
  }

  return [
    'FreeHub',
    '서비스 비교',
    '무료 서비스 비교',
    '무료 플랜',
    '무료 한도',
  ];
}

export function buildBlogPostSeoKeywords(
  tags: string[] | null,
  locale: Locale,
): string[] {
  return [
    ...(tags ?? []),
    ...(locale === 'en'
      ? ['FreeHub', 'blog', 'free services']
      : ['FreeHub', '블로그', '무료 서비스']),
  ];
}
