import { ImageResponse } from 'next/og';

import { createStaticClient } from '@/lib/supabase/server';
import { formatFreeLimit } from '@/lib/utils';
import type { Tool } from '@/types/tool';

export const alt = 'FreeHub 서비스 정보';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface OgImageProps {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: OgImageProps) {
  const { slug } = await params;
  const supabase = createStaticClient();

  const { data } = await supabase
    .from('tools')
    .select('*')
    .eq('slug', slug)
    .single();

  const tool = data as Tool | null;

  if (!tool) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
            color: 'white',
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          FreeHub
        </div>
      ),
      { ...size },
    );
  }

  const freeLimitText = formatFreeLimit(
    tool.free_limit_type,
    tool.free_limit_amount,
    tool.free_limit_unit,
  );

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          padding: 60,
          background: 'linear-gradient(135deg, #2563eb 0%, #4338ca 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {tool.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tool.logo_url}
              alt=""
              width={96}
              height={96}
              style={{
                borderRadius: 20,
                objectFit: 'cover',
                background: 'white',
              }}
            />
          ) : (
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 20,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40,
                fontWeight: 700,
              }}
            >
              {tool.name.charAt(0)}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.1 }}>
              {tool.name}
            </div>
            <div style={{ fontSize: 30, opacity: 0.95 }}>
              무료 한도: {freeLimitText}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 'auto',
            fontSize: 24,
            opacity: 0.75,
          }}
        >
          FreeHub · AI·SaaS 무료 한도 큐레이션
        </div>
      </div>
    ),
    { ...size },
  );
}
