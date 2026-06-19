import type { Metadata } from 'next';

import { buildNoIndexMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildNoIndexMetadata('회원가입');

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
