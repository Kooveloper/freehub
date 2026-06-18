'use client';

import { usePathname } from 'next/navigation';

import { Footer } from '@/components/layout/Footer';
import { HeaderWrapper } from '@/components/layout/HeaderWrapper';
import { LoginPromptModalHost } from '@/components/ui/LoginPromptModalHost';

interface PublicLayoutChromeProps {
  children: React.ReactNode;
  isAdminRoute: boolean;
}

export function PublicLayoutChrome({
  children,
  isAdminRoute,
}: PublicLayoutChromeProps) {
  const pathname = usePathname();
  const isAdmin = isAdminRoute || pathname.startsWith('/admin');

  if (isAdmin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <HeaderWrapper />
      <main className="flex-1">{children}</main>
      <Footer />
      <LoginPromptModalHost />
    </>
  );
}
