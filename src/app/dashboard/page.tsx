import type { Metadata } from 'next';
import type { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { createClient } from '@/lib/supabase/server';
import { getFavoriteToolsForUser } from '@/lib/supabase/queries';

export const metadata: Metadata = {
  title: '마이페이지',
};

function getDisplayName(user: User): string {
  const meta = user.user_metadata;
  if (meta?.full_name) return meta.full_name as string;
  if (meta?.name) return meta.name as string;
  if (user.email) return user.email.split('@')[0];
  return '회원';
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/dashboard');
  }

  const favoriteTools = await getFavoriteToolsForUser(user.id);

  return (
    <DashboardContent
      displayName={getDisplayName(user)}
      initialTools={favoriteTools}
    />
  );
}
