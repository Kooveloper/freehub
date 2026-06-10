import { notFound } from 'next/navigation';

import { ToolForm } from '@/components/admin/ToolForm';
import { getAdminCategories, getAdminToolById } from '@/lib/supabase/admin-queries';

export const dynamic = 'force-dynamic';

export default async function AdminEditToolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [tool, categories] = await Promise.all([
    getAdminToolById(id),
    getAdminCategories(),
  ]);

  if (!tool) {
    notFound();
  }

  return <ToolForm categories={categories} initialTool={tool} />;
}
