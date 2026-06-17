import type { Metadata } from 'next';

import { FavoritesSection } from '@/components/dashboard/FavoritesSection';
import { getFavoriteToolsForUser } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from '@/lib/locale';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('dashboard.favorites') };
}

export default async function DashboardFavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let favoriteTools: Awaited<ReturnType<typeof getFavoriteToolsForUser>> = [];
  if (user) {
    try {
      favoriteTools = await getFavoriteToolsForUser(user.id);
    } catch (error) {
      console.error('즐겨찾기 조회 실패:', error);
    }
  }

  return <FavoritesSection initialTools={favoriteTools} />;
}
