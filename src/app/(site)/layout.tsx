import { Footer } from '@/components/layout/Footer';
import { HeaderWrapper } from '@/components/layout/HeaderWrapper';
import { PersistSignupConsent } from '@/components/auth/PersistSignupConsent';
import { LoginPromptModalHost } from '@/components/ui/LoginPromptModalHost';

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HeaderWrapper />
      <main className="flex-1">{children}</main>
      <Footer />
      <LoginPromptModalHost />
      <PersistSignupConsent />
    </>
  );
}
