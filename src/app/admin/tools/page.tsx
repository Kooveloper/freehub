import { Suspense } from 'react';

import { ToolsManager } from '@/components/admin/ToolsManager';
import { getAdminPeriodViews30d } from '@/lib/admin/period-views';
import {
  getAdminCategories,
  getAdminSubCategories,
  getAdminTools,
} from '@/lib/supabase/admin-queries';

export const dynamic = 'force-dynamic';

function ToolsManagerFallback() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-400">
      서비스 목록을 불러오는 중…
    </div>
  );
}

export default async function AdminToolsPage() {
  const [tools, categories, subCategories, periodViews] = await Promise.all([
    getAdminTools(),
    getAdminCategories(),
    getAdminSubCategories(),
    getAdminPeriodViews30d(),
  ]);

  return (
    <Suspense fallback={<ToolsManagerFallback />}>
      <ToolsManager
        tools={tools}
        categories={categories}
        subCategories={subCategories}
        periodViewsByTool={periodViews.byTool}
      />
    </Suspense>
  );
}
