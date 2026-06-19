import type { Metadata } from 'next';

import { buildNoIndexMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildNoIndexMetadata('로그인');

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
