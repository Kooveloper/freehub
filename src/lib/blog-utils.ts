import { CATEGORIES } from '@/constants/categories';

/** 블로그 슬러그 생성 (영문 소문자·숫자·하이픈) */
export function generateBlogSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return base || `post-${Date.now()}`;
}

export function getBlogCategoryLabel(slug: string | null | undefined): string {
  if (!slug) return '기타';
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

export function getBlogCategoryColor(slug: string | null | undefined): string {
  if (!slug) return '#6B7280';
  return CATEGORIES.find((c) => c.slug === slug)?.color ?? '#6B7280';
}

export function formatBlogDate(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatBlogDateTime(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  const date = d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const time = d.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${date} ${time}`;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
