import type { Metadata } from 'next';

import { UserReviewsSection } from '@/components/dashboard/UserReviewsSection';
import { getTranslations } from '@/lib/locale';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('dashboard.myReviews') };
}

export default function DashboardReviewsPage() {
  return <UserReviewsSection />;
}
