/** 공개 블로그 글 상세 경로 (/blog/[slug]) */
export function isBlogPostPath(pathname: string): boolean {
  return /^\/blog\/[^/]+$/.test(pathname);
}

const NOINDEX_LAYOUT_PATHS = new Set([
  '/search',
  '/login',
  '/signup',
  '/submit',
  '/request',
  '/inquiry',
  '/privacy',
  '/terms',
  '/dashboard',
]);

/**
 * Next.js metadata API로 title 등을 설정하는 경로.
 * 어드민 extra_head_html의 title·description·canonical 중복 주입을 막습니다.
 */
export function shouldExcludeAdminHeadSeo(pathname: string): boolean {
  if (!pathname || pathname === '/') return true;
  if (pathname === '/blog' || pathname === '/compare') return true;
  if (isBlogPostPath(pathname)) return true;
  if (/^\/category\/[^/]+$/.test(pathname)) return true;
  if (NOINDEX_LAYOUT_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/admin')) return true;
  return false;
}
