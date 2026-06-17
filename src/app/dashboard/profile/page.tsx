import type { Metadata } from 'next';

import { ProfileSettingsForm } from '@/components/dashboard/ProfileSettingsForm';
import { getTranslations } from '@/lib/locale';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('dashboard.profile') };
}

export default function DashboardProfilePage() {
  return <ProfileSettingsForm />;
}
