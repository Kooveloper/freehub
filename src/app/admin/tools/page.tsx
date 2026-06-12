import { ToolsManager } from '@/components/admin/ToolsManager';
import { getAdminPeriodViews30d } from '@/lib/admin/period-views';
import { getAdminCategories, getAdminTools } from '@/lib/supabase/admin-queries';

export const dynamic = 'force-dynamic';

export default async function AdminToolsPage() {
  const [tools, categories, periodViews] = await Promise.all([
    getAdminTools(),
    getAdminCategories(),
    getAdminPeriodViews30d(),
  ]);

  return (
    <ToolsManager
      tools={tools}
      categories={categories}
      periodViewsByTool={periodViews.byTool}
    />
  );
}
