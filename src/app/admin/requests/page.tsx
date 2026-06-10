import { RequestsManager } from '@/components/admin/RequestsManager';
import { getAdminToolRequests } from '@/lib/supabase/admin-queries';

export const dynamic = 'force-dynamic';

export default async function AdminRequestsPage() {
  const requests = await getAdminToolRequests();

  return <RequestsManager requests={requests} />;
}
