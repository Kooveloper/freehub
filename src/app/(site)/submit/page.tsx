import { SubmitPageContent } from '@/components/submit/SubmitPageContent';
import { getToolOptions } from '@/lib/supabase/queries';

export default async function SubmitPage() {
  const tools = await getToolOptions();

  return <SubmitPageContent tools={tools} />;
}
