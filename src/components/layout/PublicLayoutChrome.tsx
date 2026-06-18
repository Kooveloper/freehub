'use client';

import { usePathname } from 'next/navigation';

import { Footer } from '@/components/layout/Footer';
import { HeaderWrapper } from '@/components/layout/HeaderWrapper';
import { LoginPromptModalHost } from '@/components/ui/LoginPromptModalHost';

export function PublicLayoutChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <>
      {!isAdmin && <HeaderWrapper />}
      <main className="flex-1">{children}</main>
      {!isAdmin && <Footer />}
      {!isAdmin && <LoginPromptModalHost />}
    </>
  );
}
