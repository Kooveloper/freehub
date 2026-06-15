import { Suspense } from 'react';
import { notFound } from 'next/navigation';

import { ToolForm } from '@/components/admin/ToolForm';
import { getAdminPeriodViews30d } from '@/lib/admin/period-views';
import { getAdminCategories, getAdminSubCategories, getAdminToolById } from '@/lib/supabase/admin-queries';

export const dynamic = 'force-dynamic';

function ToolFormFallback() {
  return (
    <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-400">
      툴 정보를 불러오는 중…
    </div>
  );
}

export default async function AdminEditToolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [tool, categories, subCategories, periodViews] = await Promise.all([
    getAdminToolById(id),
    getAdminCategories(),
    getAdminSubCategories(),
    getAdminPeriodViews30d(),
  ]);

  if (!tool) {
    notFound();
  }

  return (
    <Suspense fallback={<ToolFormFallback />}>
      <ToolForm
        categories={categories}
        subCategories={subCategories}
        initialTool={tool}
        viewCount30d={periodViews.byTool[tool.id] ?? 0}
      />
    </Suspense>
  );
}
