import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Tool } from '@/types/tool';

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  email_verified: boolean;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  provider: string;
}

export interface AdminUserFavorite {
  tool: Tool;
  favorited_at: string;
}

function mapAuthUser(user: {
  id: string;
  email?: string;
  created_at: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  app_metadata?: { provider?: string };
  identities?: { provider: string }[];
}): AdminUser {
  const provider =
    user.app_metadata?.provider ??
    user.identities?.[0]?.provider ??
    'email';

  return {
    id: user.id,
    email: user.email ?? '',
    created_at: user.created_at,
    email_verified: Boolean(user.email_confirmed_at),
    email_confirmed_at: user.email_confirmed_at ?? null,
    last_sign_in_at: user.last_sign_in_at ?? null,
    provider,
  };
}

/** 가입 회원 목록 (가입일 최신순) */
export async function getAdminUsers(): Promise<AdminUser[]> {
  const supabase = createServiceClient();
  const users: AdminUser[] = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(`회원 목록 조회 실패: ${error.message}`);
    }

    const batch = (data.users ?? []).map(mapAuthUser);
    users.push(...batch);

    if (batch.length < perPage) break;
    page += 1;
  }

  return users.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

/** 회원 단건 조회 */
export async function getAdminUserById(id: string): Promise<AdminUser | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.auth.admin.getUserById(id);

  if (error) {
    throw new Error(`회원 조회 실패: ${error.message}`);
  }

  if (!data.user) return null;

  return mapAuthUser(data.user);
}

/** 회원 즐겨찾기 툴 목록 */
export async function getAdminUserFavorites(
  userId: string,
): Promise<AdminUserFavorite[]> {
  const supabase = createServiceClient();

  const { data: favRows, error: favError } = await supabase
    .from('favorites')
    .select('tool_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (favError) {
    throw new Error(`즐겨찾기 조회 실패: ${favError.message}`);
  }

  if (!favRows?.length) return [];

  const toolIds = favRows.map((row) => row.tool_id as string);

  const { data: tools, error: toolsError } = await supabase
    .from('tools')
    .select('*')
    .in('id', toolIds);

  if (toolsError) {
    throw new Error(`즐겨찾기 툴 조회 실패: ${toolsError.message}`);
  }

  const toolMap = new Map(
    (tools ?? []).map((tool) => [tool.id as string, tool as Tool]),
  );

  return favRows
    .map((row) => {
      const tool = toolMap.get(row.tool_id as string);
      if (!tool) return null;
      return {
        tool,
        favorited_at: row.created_at as string,
      };
    })
    .filter((item): item is AdminUserFavorite => item != null);
}
