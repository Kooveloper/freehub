import { FeaturedToolsManager } from '@/components/admin/FeaturedToolsManager';
import { getAdminPeriodViews30d } from '@/lib/admin/period-views';

export const dynamic = 'force-dynamic';

export default async function AdminFeaturedPage() {
  const periodViews = await getAdminPeriodViews30d();

  return (
    <FeaturedToolsManager periodViewsByTool={periodViews.byTool} />
  );
}
