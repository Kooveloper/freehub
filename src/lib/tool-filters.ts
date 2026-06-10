import type { SortOption } from '@/components/tools/ToolFilter';
import type { FreeLimitType, Tool } from '@/types/tool';

const LIMIT_KEYS = new Set(['daily', 'monthly', 'unlimited']);

export function parseFilters(param: string | null): Set<string> {
  if (!param) return new Set();
  return new Set(param.split(',').filter(Boolean));
}

export function applyToolFilters(tools: Tool[], filters: Set<string>): Tool[] {
  const limitFilters = [...filters].filter((f) => LIMIT_KEYS.has(f));

  return tools.filter((tool) => {
    if (limitFilters.length > 0) {
      if (!limitFilters.includes(tool.free_limit_type as FreeLimitType)) {
        return false;
      }
    }

    return true;
  });
}

export function sortTools(
  tools: Tool[],
  sort: SortOption,
  locale = 'ko',
): Tool[] {
  const copy = [...tools];

  switch (sort) {
    case 'updated':
      return copy.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
    case 'name':
      return copy.sort((a, b) =>
        a.name.localeCompare(b.name, locale === 'en' ? 'en' : 'ko'),
      );
    default:
      return copy.sort((a, b) => b.view_count - a.view_count);
  }
}

export function orderWithFavorites(
  tools: Tool[],
  favoriteIds: string[],
): Tool[] {
  const favoriteSet = new Set(favoriteIds);
  const toolMap = new Map(tools.map((tool) => [tool.id, tool]));

  const favorites = favoriteIds
    .map((id) => toolMap.get(id))
    .filter((tool): tool is Tool => tool != null);

  const others = tools.filter((tool) => !favoriteSet.has(tool.id));
  return [...favorites, ...others];
}
