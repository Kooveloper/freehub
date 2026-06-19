import type { Metadata } from 'next';

import { buildNoIndexMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildNoIndexMetadata('검색');

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
