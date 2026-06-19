import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = buildNoIndexMetadata('마이페이지');

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/dashboard');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
