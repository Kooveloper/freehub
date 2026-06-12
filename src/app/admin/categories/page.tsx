import { CategoriesManager } from '@/components/admin/CategoriesManager';
import { getAdminPeriodViews30d } from '@/lib/admin/period-views';
import {
  getAdminCategories,
  getAdminSubCategories,
} from '@/lib/supabase/admin-queries';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const [categories, subCategories, periodViews] = await Promise.all([
    getAdminCategories(),
    getAdminSubCategories(),
    getAdminPeriodViews30d(),
  ]);

  return (
    <CategoriesManager
      categories={categories}
      subCategories={subCategories}
      periodViewsByCategory={periodViews.byCategory}
      periodViewsBySubCategory={periodViews.bySubCategory}
    />
  );
}
