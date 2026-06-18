import { FavoritesSection } from '@/components/dashboard/FavoritesSection';
import { getFavoriteToolsForUser } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/server';

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
