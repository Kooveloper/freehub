import { BlogAutomationSettingsForm } from '@/components/admin/BlogAutomationSettingsForm';
import { getAllCategories } from '@/lib/supabase/queries';
import { isBlogTargetCategory } from '@/types/blog';

export default async function AdminBlogAutomationPage() {
  const categories = (await getAllCategories()).filter((category) =>
    isBlogTargetCategory(category.slug),
  );

  return <BlogAutomationSettingsForm categories={categories} />;
}
