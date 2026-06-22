export const ADMIN_TOOL_TOAST_KEY = 'admin-tool-toast';

export type AdminToolToastType = 'success' | 'error';

export interface AdminToolToast {
  message: string;
  type: AdminToolToastType;
}

export function queueAdminToolToast(
  message: string,
  type: AdminToolToastType = 'success',
) {
  sessionStorage.setItem(
    ADMIN_TOOL_TOAST_KEY,
    JSON.stringify({ message, type } satisfies AdminToolToast),
  );
}

export function consumeAdminToolToast(): AdminToolToast | null {
  const raw = sessionStorage.getItem(ADMIN_TOOL_TOAST_KEY);
  if (!raw) return null;

  sessionStorage.removeItem(ADMIN_TOOL_TOAST_KEY);

  try {
    const parsed = JSON.parse(raw) as AdminToolToast;
    if (!parsed?.message) return null;
    return parsed;
  } catch {
    return null;
  }
}

export type AdminToolsVerifiedFilter = '' | 'verified' | 'unverified';
export type AdminToolsSponsoredFilter = '' | 'sponsored' | 'not-sponsored';

export function buildAdminToolsListUrl(filters: {
  q?: string;
  category?: string;
  sub?: string;
  verified?: AdminToolsVerifiedFilter;
  sponsored?: AdminToolsSponsoredFilter;
  page?: number;
  size?: number;
}): string {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set('q', filters.q.trim());
  if (filters.category) params.set('category', filters.category);
  if (filters.sub) params.set('sub', filters.sub);
  if (filters.verified) params.set('verified', filters.verified);
  if (filters.sponsored) params.set('sponsored', filters.sponsored);
  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page));
  }
  if (filters.size && filters.size !== 10) {
    params.set('size', String(filters.size));
  }

  const query = params.toString();
  return query ? `/admin/tools?${query}` : '/admin/tools';
}

export function safeAdminToolsReturnPath(returnParam: string | null): string {
  if (!returnParam || !returnParam.startsWith('/admin/tools')) {
    return '/admin/tools';
  }
  return returnParam;
}
