/** 공개 블로그 글 상세 경로 (/blog/[slug]) */
export function isBlogPostPath(pathname: string): boolean {
  return /^\/blog\/[^/]+$/.test(pathname);
}
