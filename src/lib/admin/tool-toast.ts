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

export function buildAdminToolsListUrl(filters: {
  q?: string;
  category?: string;
  sub?: string;
}): string {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set('q', filters.q.trim());
  if (filters.category) params.set('category', filters.category);
  if (filters.sub) params.set('sub', filters.sub);

  const query = params.toString();
  return query ? `/admin/tools?${query}` : '/admin/tools';
}

export function safeAdminToolsReturnPath(returnParam: string | null): string {
  if (!returnParam || !returnParam.startsWith('/admin/tools')) {
    return '/admin/tools';
  }
  return returnParam;
}
