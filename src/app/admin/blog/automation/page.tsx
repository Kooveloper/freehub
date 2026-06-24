import { BlogAutomationSettingsForm } from '@/components/admin/BlogAutomationSettingsForm';
import { getAllCategories } from '@/lib/supabase/queries';

export default async function AdminBlogAutomationPage() {
  const categories = await getAllCategories();

  return <BlogAutomationSettingsForm categories={categories} />;
}
