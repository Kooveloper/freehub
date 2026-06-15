import { ToolForm } from '@/components/admin/ToolForm';
import {
  getAdminCategories,
  getAdminSubCategories,
} from '@/lib/supabase/admin-queries';

export const dynamic = 'force-dynamic';

export default async function AdminNewToolPage() {
  const [categories, subCategories] = await Promise.all([
    getAdminCategories(),
    getAdminSubCategories(),
  ]);

  return <ToolForm categories={categories} subCategories={subCategories} />;
}
