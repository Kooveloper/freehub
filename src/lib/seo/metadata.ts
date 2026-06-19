import type { Metadata } from 'next';

import type { Locale } from '@/i18n/config';

import {
  buildBlogListSeoCopy,
  buildBlogListSeoKeywords,
  buildBlogPostSeoCopy,
  buildBlogPostSeoKeywords,
  buildCategorySeoCopy,
  buildCategorySeoKeywords,
  buildCompareSeoCopy,
  buildCompareSeoKeywords,
  buildHomeSeoKeywords,
  getSiteSeoBase,
  type SiteSeoBase,
} from '@/lib/seo/site-seo';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'FreeHub';

export const NOINDEX_ROBOTS: Metadata['robots'] = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
};

export function buildNoIndexMetadata(title: string): Metadata {
  return {
    title,
    robots: NOINDEX_ROBOTS,
  };
}

export function buildPageMetadata(options: {
  title: string;
  description: string;
  keywords?: string | string[];
  robots?: Metadata['robots'];
}): Metadata {
  return {
    title: options.title,
    description: options.description,
    keywords: options.keywords,
    robots: options.robots ?? {
      index: true,
      follow: true,
    },
  };
}

export async function buildHomeMetadata(locale: Locale): Promise<Metadata> {
  const base = await getSiteSeoBase(locale);
  return buildPageMetadata({
    title: base.title,
    description: base.description,
    keywords: buildHomeSeoKeywords(locale),
  });
}

export async function buildCategoryMetadata(
  categoryName: string,
  locale: Locale,
): Promise<Metadata> {
  const base = await getSiteSeoBase(locale);
  const copy = buildCategorySeoCopy(base, categoryName, locale);

  return buildPageMetadata({
    title: copy.title,
    description: copy.description,
    keywords: buildCategorySeoKeywords(categoryName, locale),
  });
}

export async function buildBlogListMetadata(
  locale: Locale,
): Promise<Metadata> {
  const base = await getSiteSeoBase(locale);
  const copy = buildBlogListSeoCopy(base, locale);

  return buildPageMetadata({
    title: copy.title,
    description: copy.description,
    keywords: buildBlogListSeoKeywords(locale),
  });
}

export async function buildBlogPostMetadata(
  postTitle: string,
  metaDescription: string | null,
  tags: string[] | null,
  locale: Locale,
): Promise<Metadata> {
  const base = await getSiteSeoBase(locale);
  const copy = buildBlogPostSeoCopy(base, postTitle, metaDescription, locale);

  return buildPageMetadata({
    title: copy.title,
    description: copy.description,
    keywords: buildBlogPostSeoKeywords(tags, locale),
  });
}

export async function buildCompareMetadata(locale: Locale): Promise<Metadata> {
  const base = await getSiteSeoBase(locale);
  const copy = buildCompareSeoCopy(base, locale);

  return buildPageMetadata({
    title: copy.title,
    description: copy.description,
    keywords: buildCompareSeoKeywords(locale),
  });
}

export type { SiteSeoBase };
