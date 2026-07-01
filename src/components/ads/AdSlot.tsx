'use client';

import type { AdSlots } from '@/types/site-settings';
import { useAdsActive } from '@/hooks/useAdsActive';
import { cn } from '@/lib/utils';

import { AdBanner } from './AdBanner';

type AdVariant = 'banner' | 'infeed' | 'sidebar' | 'inarticle';

interface AdSlotProps {
  slotKey: keyof AdSlots;
  variant?: AdVariant;
  /** 광고 컨테이너 스타일 */
  className?: string;
  /** 광고가 켜져 있을 때만 적용되는 바깥 래퍼 (여백·레이아웃) */
  outerClassName?: string;
  adFormat?: string;
  adLayout?: string;
  adLayoutKey?: string | null;
  fullWidthResponsive?: boolean;
  style?: React.CSSProperties;
  onLoadError?: () => void;
}

const CONTAINER_CLASS: Record<AdVariant, string> = {
  banner:
    'overflow-hidden rounded-xl border border-brand-200/40 bg-white/50 shadow-sm backdrop-blur-sm',
  infeed:
    'min-h-[250px] overflow-hidden rounded-xl border border-brand-200/50 bg-white/70 shadow-sm shadow-brand-900/5',
  sidebar: '',
  inarticle: '',
};

const AD_CLASS: Record<AdVariant, string> = {
  banner: 'min-h-[90px] w-full',
  infeed: 'h-full min-h-[250px] w-full',
  sidebar: 'h-[600px] w-[160px]',
  inarticle: 'w-full',
};

/**
 * 페이지에 광고를 배치할 때 사용.
 * 광고가 꺼져 있으면 null — 빈 섹션·여백이 생기지 않음.
 */
export function AdSlot({
  slotKey,
  variant = 'banner',
  className,
  outerClassName,
  adFormat,
  adLayout,
  adLayoutKey,
  fullWidthResponsive,
  style,
  onLoadError,
}: AdSlotProps) {
  const active = useAdsActive();

  if (!active) return null;

  const banner = (
    <AdBanner
      slotKey={slotKey}
      adFormat={adFormat}
      adLayout={adLayout}
      adLayoutKey={adLayoutKey}
      fullWidthResponsive={fullWidthResponsive ?? variant !== 'sidebar'}
      className={AD_CLASS[variant]}
      style={style}
      onLoadError={onLoadError}
    />
  );

  if (variant === 'sidebar' || variant === 'inarticle') {
    return banner;
  }

  const slot = (
    <div className={cn(CONTAINER_CLASS[variant], className)}>{banner}</div>
  );

  if (outerClassName) {
    return <div className={outerClassName}>{slot}</div>;
  }

  return slot;
}
