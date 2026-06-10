import {
  ADMIN_ITEM_STATUSES,
  type AdminItemStatus,
} from '@/constants/admin-status';

export interface AdminRequestRow {
  id: string;
  title: string;
  content: string;
  email: string | null;
  status: AdminItemStatus;
  admin_memo: string | null;
  created_at: string;
}

const MEMO_MAX = 1000;

export interface RequestUpdateInput {
  status?: AdminItemStatus;
  admin_memo?: string | null;
}

export function validateRequestUpdate(body: unknown): RequestUpdateInput | null {
  if (!body || typeof body !== 'object') return null;

  const input = body as Record<string, unknown>;
  const result: RequestUpdateInput = {};

  if ('status' in input) {
    const status = String(input.status ?? '').trim();
    if (!ADMIN_ITEM_STATUSES.includes(status as AdminItemStatus)) return null;
    result.status = status as AdminItemStatus;
  }

  if ('admin_memo' in input) {
    if (input.admin_memo === null) {
      result.admin_memo = null;
    } else {
      const memo = String(input.admin_memo ?? '').trim();
      if (memo.length > MEMO_MAX) return null;
      result.admin_memo = memo || null;
    }
  }

  if (result.status === undefined && result.admin_memo === undefined) {
    return null;
  }

  return result;
}
