import type { Metadata } from 'next';

import { buildCompareMetadata } from '@/lib/seo/metadata';
import { getLocale } from '@/lib/locale';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return buildCompareMetadata(locale);
}

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
