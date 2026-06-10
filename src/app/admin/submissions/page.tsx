import { SubmissionsManager } from '@/components/admin/SubmissionsManager';
import { getAdminSubmissions } from '@/lib/supabase/admin-queries';

export const dynamic = 'force-dynamic';

export default async function AdminSubmissionsPage() {
  const submissions = await getAdminSubmissions();

  return <SubmissionsManager submissions={submissions} />;
}
