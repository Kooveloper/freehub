import type { Metadata } from 'next';

import { buildNoIndexMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildNoIndexMetadata('문의하기');

export default function InquiryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
