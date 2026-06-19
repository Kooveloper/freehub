import type { Metadata } from 'next';

import { buildNoIndexMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildNoIndexMetadata('이용약관');

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
