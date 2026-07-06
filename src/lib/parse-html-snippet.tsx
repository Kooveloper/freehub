import type { ReactNode } from 'react';

function parseAttrs(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([\w:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"'>/]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(attrString)) !== null) {
    const key = match[1];
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attrs[key] = value;
  }

  return attrs;
}

const PAGE_SEO_META_NAMES = new Set([
  'description',
  'twitter:title',
  'twitter:description',
]);

const PAGE_SEO_META_PROPERTIES = new Set(['og:title', 'og:description']);

function isPageSeoMeta(attrs: Record<string, string>): boolean {
  const name = attrs.name?.toLowerCase();
  const property = attrs.property?.toLowerCase();
  if (name && PAGE_SEO_META_NAMES.has(name)) return true;
  if (property && PAGE_SEO_META_PROPERTIES.has(property)) return true;
  return false;
}

export interface ParseHtmlSnippetOptions {
  /** 페이지별 title/description·OG 등 — 블로그 글 등에서 중복 방지 */
  excludePageSeo?: boolean;
}

/** head/body에 붙일 HTML 스니펫(meta, link, script, noscript) 파싱 */
export function parseHtmlSnippet(
  html: string,
  options?: ParseHtmlSnippetOptions,
): ReactNode[] {
  const trimmed = html.trim();
  if (!trimmed) return [];

  const nodes: ReactNode[] = [];
  let index = 0;

  const metaRegex = /<meta\s+([^>]+?)\s*\/?>/gi;
  let match: RegExpExecArray | null;
  while ((match = metaRegex.exec(trimmed)) !== null) {
    const attrs = parseAttrs(match[1]);
    if (options?.excludePageSeo && isPageSeoMeta(attrs)) continue;
    nodes.push(<meta key={`meta-${index++}`} {...attrs} />);
  }

  if (!options?.excludePageSeo) {
    const titleRegex = /<title>([\s\S]*?)<\/title>/gi;
    while ((match = titleRegex.exec(trimmed)) !== null) {
      nodes.push(<title key={`title-${index++}`}>{match[1]}</title>);
    }
  }

  const linkRegex = /<link\s+([^>]+?)\s*\/?>/gi;
  while ((match = linkRegex.exec(trimmed)) !== null) {
    const attrs = parseAttrs(match[1]);
    nodes.push(<link key={`link-${index++}`} {...attrs} />);
  }

  const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  while ((match = scriptRegex.exec(trimmed)) !== null) {
    const attrs = parseAttrs(match[1]);
    const inner = match[2];
    if (attrs.src) {
      nodes.push(<script key={`script-${index++}`} {...attrs} />);
    } else if (inner.trim()) {
      nodes.push(
        <script
          key={`script-${index++}`}
          {...attrs}
          dangerouslySetInnerHTML={{ __html: inner }}
        />,
      );
    }
  }

  const noscriptRegex = /<noscript>([\s\S]*?)<\/noscript>/gi;
  while ((match = noscriptRegex.exec(trimmed)) !== null) {
    nodes.push(
      <noscript
        key={`noscript-${index++}`}
        dangerouslySetInnerHTML={{ __html: match[1] }}
      />,
    );
  }

  return nodes;
}
