import type { BlogTargetCategory, CtaColor, CtaLink } from '@/types/blog';

export const CATEGORY_CTA_MAP: Record<
  BlogTargetCategory,
  { label: string; url: string; color: CtaColor }
> = {
  image: {
    label: '무료 이미지 편집 서비스 보기',
    url: 'https://www.freehub.kr/category/image',
    color: 'blue',
  },
  text: {
    label: 'AI 글쓰기 서비스 보기',
    url: 'https://www.freehub.kr/category/text',
    color: 'green',
  },
  video: {
    label: '무료 영상 편집 서비스 보기',
    url: 'https://www.freehub.kr/category/video',
    color: 'red',
  },
  audio: {
    label: '무료 음성·음악 서비스 보기',
    url: 'https://www.freehub.kr/category/audio',
    color: 'purple',
  },
  code: {
    label: '무료 코딩 도구 보기',
    url: 'https://www.freehub.kr/category/code',
    color: 'orange',
  },
  design: {
    label: '무료 디자인 툴 보기',
    url: 'https://www.freehub.kr/category/design',
    color: 'pink',
  },
  marketing: {
    label: '무료 마케팅 툴 보기',
    url: 'https://www.freehub.kr/category/marketing',
    color: 'amber',
  },
  productivity: {
    label: '무료 생산성 툴 보기',
    url: 'https://www.freehub.kr/category/productivity',
    color: 'teal',
  },
};

export const CATEGORY_EMOJI: Record<BlogTargetCategory, string> = {
  image: '🖼️',
  text: '✍️',
  video: '🎬',
  audio: '🎙️',
  code: '💻',
  design: '🎨',
  marketing: '📣',
  productivity: '⚡',
};

export const CTA_COLOR_BADGE_CLASS: Record<CtaColor, string> = {
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  orange: 'bg-orange-100 text-orange-800',
  purple: 'bg-purple-100 text-purple-800',
  red: 'bg-red-100 text-red-800',
  pink: 'bg-pink-100 text-pink-800',
  amber: 'bg-amber-100 text-amber-800',
  teal: 'bg-teal-100 text-teal-800',
};

export function syncCtaLinksFromCategories(
  targetCategories: BlogTargetCategory[],
  existingLinks?: CtaLink[] | null,
): CtaLink[] {
  return targetCategories.map((slug) => {
    const template = CATEGORY_CTA_MAP[slug];
    const existing = existingLinks?.find((link) => link.url === template.url);

    return {
      id: existing?.id ?? crypto.randomUUID(),
      label: existing?.label?.trim() ? existing.label : template.label,
      url: template.url,
      color: template.color,
    };
  });
}
