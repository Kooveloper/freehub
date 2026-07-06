import { parseHtmlSnippet } from '@/lib/parse-html-snippet';

export function SiteHeadCode({
  html,
  excludePageSeo = false,
}: {
  html: string | null;
  excludePageSeo?: boolean;
}) {
  if (!html) return null;
  const nodes = parseHtmlSnippet(html, { excludePageSeo });
  if (nodes.length === 0) return null;
  return <>{nodes}</>;
}

export function SiteBodyTopCode({ html }: { html: string | null }) {
  if (!html) return null;

  const parsed = parseHtmlSnippet(html);
  if (parsed.length > 0) {
    return <>{parsed}</>;
  }

  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
