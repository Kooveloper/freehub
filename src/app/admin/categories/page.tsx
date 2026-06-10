import { CategoriesManager } from '@/components/admin/CategoriesManager';
import { getAdminCategories } from '@/lib/supabase/admin-queries';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return <CategoriesManager categories={categories} />;
}
