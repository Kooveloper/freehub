import type { Metadata } from 'next';

import { InquiryPageContent } from '@/components/inquiry/InquiryPageContent';
import { getTranslations } from '@/lib/locale';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t('inquiry.pageTitle'),
    description: t('inquiry.pageDescription'),
  };
}

export default function InquiryPage() {
  return <InquiryPageContent />;
}
