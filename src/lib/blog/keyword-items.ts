import type { KeywordItem } from '@/types/blog';

function createKeywordItemId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `kw-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export { createKeywordItemId };

export function normalizeMainKeywords(raw: unknown): KeywordItem[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item): KeywordItem | null => {
      if (typeof item === 'string') {
        const keyword = item.trim();
        if (!keyword) return null;
        return {
          id: createKeywordItemId(),
          keyword,
          category: '',
          sub_category: '',
        };
      }

      if (!item || typeof item !== 'object') return null;

      const record = item as Record<string, unknown>;
      const keyword = String(record.keyword ?? '').trim();
      if (!keyword) return null;

      return {
        id:
          typeof record.id === 'string' && record.id.trim()
            ? record.id
            : createKeywordItemId(),
        keyword,
        category: String(record.category ?? '').trim(),
        sub_category: String(record.sub_category ?? '').trim(),
      };
    })
    .filter((item): item is KeywordItem => item !== null);
}
