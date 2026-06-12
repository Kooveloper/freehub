import { CategoriesManager } from '@/components/admin/CategoriesManager';
import {
  getAdminCategories,
  getAdminSubCategories,
} from '@/lib/supabase/admin-queries';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const [categories, subCategories] = await Promise.all([
    getAdminCategories(),
    getAdminSubCategories(),
  ]);

  return (
    <CategoriesManager categories={categories} subCategories={subCategories} />
  );
}
