import { notFound } from 'next/navigation';

import { UserDetailManager } from '@/components/admin/UserDetailManager';
import {
  getAdminUserById,
  getAdminUserFavorites,
  getUserReviewsForAdmin,
} from '@/lib/supabase/admin-users';

export const dynamic = 'force-dynamic';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [user, favorites, reviews] = await Promise.all([
    getAdminUserById(id),
    getAdminUserFavorites(id),
    getUserReviewsForAdmin(id),
  ]);

  if (!user) {
    notFound();
  }

  return <UserDetailManager user={user} favorites={favorites} reviews={reviews} />;
}
