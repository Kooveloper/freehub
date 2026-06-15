import { notFound } from 'next/navigation';

import { UserDetailManager } from '@/components/admin/UserDetailManager';
import {
  getAdminUserById,
  getAdminUserFavorites,
} from '@/lib/supabase/admin-users';

export const dynamic = 'force-dynamic';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [user, favorites] = await Promise.all([
    getAdminUserById(id),
    getAdminUserFavorites(id),
  ]);

  if (!user) {
    notFound();
  }

  return <UserDetailManager user={user} favorites={favorites} />;
}
