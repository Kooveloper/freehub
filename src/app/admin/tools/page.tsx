import { ToolsManager } from '@/components/admin/ToolsManager';
import { getAdminPeriodViews30d } from '@/lib/admin/period-views';
import {
  getAdminCategories,
  getAdminSubCategories,
  getAdminTools,
} from '@/lib/supabase/admin-queries';

export const dynamic = 'force-dynamic';

export default async function AdminToolsPage() {
  const [tools, categories, subCategories, periodViews] = await Promise.all([
    getAdminTools(),
    getAdminCategories(),
    getAdminSubCategories(),
    getAdminPeriodViews30d(),
  ]);

  return (
    <ToolsManager
      tools={tools}
      categories={categories}
      subCategories={subCategories}
      periodViewsByTool={periodViews.byTool}
    />
  );
}
