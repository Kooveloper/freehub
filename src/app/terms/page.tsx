import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPageContent } from '@/components/legal/LegalPageContent';
import { getLegalPage } from '@/lib/legal-pages';
import { getLocale } from '@/lib/locale';

const FALLBACK = {
  title_ko: '이용약관',
  title_en: 'Terms of Service',
  effective_date: '2026-06-08',
  content_ko: `FreeHub 서비스 이용약관입니다.

## 1. 서비스 목적

FreeHub는 AI·SaaS 도구의 무료 플랜 정보를 제공하는 큐레이션 서비스입니다.

## 2. 면책

제공 정보는 참고용이며, 각 서비스의 최신 약관을 확인해야 합니다.

## 3. 문의

문의: admin@freehub.kr`,
  content_en: `Terms of Service for FreeHub.

## 1. Purpose

FreeHub curates free-tier information for AI and SaaS tools.

## 2. Disclaimer

Information is for reference only. Check each service's latest terms.

## 3. Contact

Contact: admin@freehub.kr`,
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const page = await getLegalPage('terms');
  const title =
    locale === 'en'
      ? page?.title_en || page?.title_ko || FALLBACK.title_en
      : page?.title_ko || FALLBACK.title_ko;

  return {
    title,
    description: title,
  };
}

export default async function TermsPage() {
  const locale = await getLocale();
  const page = await getLegalPage('terms');
  const title =
    locale === 'en'
      ? page?.title_en || page?.title_ko || FALLBACK.title_en
      : page?.title_ko || FALLBACK.title_ko;
  const content =
    locale === 'en'
      ? page?.content_en || page?.content_ko || FALLBACK.content_en
      : page?.content_ko || FALLBACK.content_ko;
  const effectiveDate = page?.effective_date ?? FALLBACK.effective_date;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10 border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">
          {locale === 'en' ? 'Effective date: ' : '시행일: '}
          {effectiveDate}
        </p>
      </header>

      <LegalPageContent content={content} />

      <p className="mt-10 text-sm text-gray-500">
        <Link href="/privacy" className="text-blue-600 hover:underline">
          {locale === 'en' ? 'Privacy Policy' : '개인정보처리방침'}
        </Link>
      </p>
    </div>
  );
}
