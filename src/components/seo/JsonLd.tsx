interface JsonLdScriptProps {
  data: Record<string, unknown>;
}

function JsonLdScript({ data }: JsonLdScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export interface SoftwareApplicationJsonLdProps {
  name: string;
  description: string;
  applicationCategory: string;
  url: string;
}

/** 서비스 상세 페이지용 SoftwareApplication 스키마 */
export function SoftwareApplicationJsonLd({
  name,
  description,
  applicationCategory,
  url,
}: SoftwareApplicationJsonLdProps) {
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name,
        description,
        applicationCategory,
        url,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'KRW',
        },
      }}
    />
  );
}

export interface WebSiteJsonLdProps {
  name: string;
  url: string;
  searchUrl: string;
}

/** 홈페이지용 WebSite + SearchAction 스키마 */
export function WebSiteJsonLd({ name, url, searchUrl }: WebSiteJsonLdProps) {
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name,
        url,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${searchUrl}{search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  );
}

export interface BlogPostingJsonLdProps {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
}

/** 블로그 상세용 BlogPosting 스키마 */
export function BlogPostingJsonLd({
  title,
  description,
  url,
  datePublished,
  dateModified,
}: BlogPostingJsonLdProps) {
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description,
        url,
        datePublished,
        dateModified,
        author: {
          '@type': 'Organization',
          name: 'FreeHub',
        },
        publisher: {
          '@type': 'Organization',
          name: 'FreeHub',
        },
      }}
    />
  );
}
