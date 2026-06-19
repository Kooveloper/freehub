import type { Metadata } from 'next';

import { buildNoIndexMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildNoIndexMetadata('서비스 제보');

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
