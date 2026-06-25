import { ImageResponse } from 'next/og';

import { getBlogCategoryLabel, normalizeBlogSlug } from '@/lib/blog-utils';
import { createStaticClient } from '@/lib/supabase/server';

export const alt = 'FreeHub 블로그';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const runtime = 'edge';

interface OgImageProps {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: OgImageProps) {
  const { slug } = await params;
  const normalizedSlug = normalizeBlogSlug(slug);
  const supabase = createStaticClient();

  const { data } = await supabase
    .from('blog_posts')
    .select('title, category')
    .eq('slug', normalizedSlug)
    .eq('status', 'published')
    .maybeSingle();

  const title = (data?.title as string) ?? 'FreeHub 블로그';
  const category = getBlogCategoryLabel(data?.category as string | null);

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          padding: 60,
          background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 24, opacity: 0.9 }}>FreeHub 블로그</div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 1.2,
            maxWidth: '90%',
          }}
        >
          {title.length > 80 ? `${title.slice(0, 80)}…` : title}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 22,
          }}
        >
          <span
            style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '8px 20px',
              borderRadius: 999,
              fontSize: 18,
            }}
          >
            {category}
          </span>
          <span style={{ opacity: 0.85 }}>freehub.kr</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
