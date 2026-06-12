import { notFound } from 'next/navigation';

import { ToolForm } from '@/components/admin/ToolForm';
import { getAdminPeriodViews30d } from '@/lib/admin/period-views';
import { getAdminCategories, getAdminToolById } from '@/lib/supabase/admin-queries';

export const dynamic = 'force-dynamic';

export default async function AdminEditToolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [tool, categories, periodViews] = await Promise.all([
    getAdminToolById(id),
    getAdminCategories(),
    getAdminPeriodViews30d(),
  ]);

  if (!tool) {
    notFound();
  }

  return (
    <ToolForm
      categories={categories}
      initialTool={tool}
      viewCount30d={periodViews.byTool[tool.id] ?? 0}
    />
  );
}
