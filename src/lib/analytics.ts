declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function gtagEvent(eventName: string, params: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', eventName, params);
}

/** 서비스 상세 페이지 조회 */
export function trackToolView(toolName: string, category: string) {
  gtagEvent('tool_view', {
    tool_name: toolName,
    category,
  });
}

/** 툴 외부 링크 클릭 (공식 사이트, CTA 등) */
export function trackToolClickExternal(toolName: string, url: string) {
  gtagEvent('tool_click_external', {
    tool_name: toolName,
    link_url: url,
  });
}

/** 검색 실행 */
export function trackSearch(searchTerm: string, resultCount: number) {
  gtagEvent('search', {
    search_term: searchTerm,
    result_count: resultCount,
  });
}

/** 즐겨찾기 추가 */
export function trackFavoriteAdd(toolName: string) {
  gtagEvent('favorite_add', {
    tool_name: toolName,
  });
}

/** 즐겨찾기 제거 */
export function trackFavoriteRemove(toolName: string) {
  gtagEvent('favorite_remove', {
    tool_name: toolName,
  });
}
