import Link from 'next/link';

import { LegalPageContent } from '@/components/legal/LegalPageContent';
import { getLegalPage } from '@/lib/legal-pages';
import { getLocale } from '@/lib/locale';

const FALLBACK = {
  title_ko: '개인정보처리방침',
  title_en: 'Privacy Policy',
  effective_date: '2026-06-08',
  content_ko: `FreeHub(이하 "서비스")는 이용자의 개인정보를 중요하게 생각하며, 관련 법령을 준수합니다.

## 1. 수집하는 개인정보

- 이메일 주소: 회원가입, 요청 접수 시
- 쿠키: Google Analytics, Google AdSense
- IP 주소: Rate Limiting 등 남용 방지

## 2. 문의

문의: admin@freehub.kr`,
  content_en: `FreeHub ("Service") respects your privacy and complies with applicable laws.

## 1. Information We Collect

- Email address: sign-up, submissions, and requests
- Cookies: Google Analytics, Google AdSense
- IP address: abuse prevention

## 2. Contact

Contact: admin@freehub.kr`,
};

export default async function PrivacyPage() {
  const locale = await getLocale();
  const page = await getLegalPage('privacy');
  const title =
    locale === 'en'
      ? page?.title_en || page?.title_ko || FALLBACK.title_en
      : page?.title_ko || FALLBACK.title_ko;
  const content =
    locale === 'en'
      ? page?.content_en || page?.content_ko || FALLBACK.content_en
      : page?.content_ko || FALLBACK.content_ko;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10 border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
      </header>

      <LegalPageContent content={content} />

      <p className="mt-10 text-sm text-gray-500">
        <Link href="/terms" className="text-blue-600 hover:underline">
          {locale === 'en' ? 'Terms of Service' : '이용약관'}
        </Link>
      </p>
    </div>
  );
}
