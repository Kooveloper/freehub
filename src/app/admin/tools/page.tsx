import { ToolsManager } from '@/components/admin/ToolsManager';
import { getAdminCategories, getAdminTools } from '@/lib/supabase/admin-queries';

export const dynamic = 'force-dynamic';

export default async function AdminToolsPage() {
  const [tools, categories] = await Promise.all([
    getAdminTools(),
    getAdminCategories(),
  ]);

  return <ToolsManager tools={tools} categories={categories} />;
}
