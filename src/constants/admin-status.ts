export const ADMIN_ITEM_STATUSES = [
  'pending',
  'reviewing',
  'done',
  'rejected',
] as const;

export type AdminItemStatus = (typeof ADMIN_ITEM_STATUSES)[number];

export const ADMIN_STATUS_LABELS: Record<AdminItemStatus, string> = {
  pending: '대기',
  reviewing: '검토중',
  done: '완료',
  rejected: '반려',
};

export function isAdminItemStatus(value: string): value is AdminItemStatus {
  return ADMIN_ITEM_STATUSES.includes(value as AdminItemStatus);
}
