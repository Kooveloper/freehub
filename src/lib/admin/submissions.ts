import {
  ADMIN_ITEM_STATUSES,
  type AdminItemStatus,
} from '@/constants/admin-status';
import type { SubmissionType } from '@/types/submission';

export interface AdminSubmissionRow {
  id: string;
  type: SubmissionType;
  tool_name: string | null;
  tool_url: string | null;
  description: string;
  submitter_email: string | null;
  status: AdminItemStatus;
  created_at: string;
}

export function validateSubmissionStatusUpdate(
  body: unknown,
): AdminItemStatus | null {
  if (!body || typeof body !== 'object') return null;

  const status = String((body as Record<string, unknown>).status ?? '').trim();
  if (!ADMIN_ITEM_STATUSES.includes(status as AdminItemStatus)) return null;

  return status as AdminItemStatus;
}
