import type { Metadata } from 'next';

import { SubmitPageContent } from '@/components/submit/SubmitPageContent';
import { getTranslations } from '@/lib/locale';
import { getToolOptions } from '@/lib/supabase/queries';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t('submit.pageTitle'),
    description: t('submit.pageDescription'),
  };
}

export default async function SubmitPage() {
  const tools = await getToolOptions();

  return <SubmitPageContent tools={tools} />;
}
