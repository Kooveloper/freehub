import { UsersManager } from '@/components/admin/UsersManager';
import { getAdminUsers } from '@/lib/supabase/admin-users';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return <UsersManager users={users} />;
}
