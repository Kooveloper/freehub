import { ToolForm } from '@/components/admin/ToolForm';
import { getAdminCategories } from '@/lib/supabase/admin-queries';

export const dynamic = 'force-dynamic';

export default async function AdminNewToolPage() {
  const categories = await getAdminCategories();

  return <ToolForm categories={categories} />;
}
