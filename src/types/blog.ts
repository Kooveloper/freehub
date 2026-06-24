export type BlogPostStatus = 'draft' | 'published';
export type BlogPostSource = 'manual' | 'auto';
export type PublishSchedule = 'daily' | 'weekdays' | 'weekly';
export type PostLength = 'short' | 'medium' | 'long';
export type CtaColor =
  | 'blue'
  | 'green'
  | 'orange'
  | 'purple'
  | 'red'
  | 'pink'
  | 'amber'
  | 'teal';

export type BlogTargetCategory =
  | 'image'
  | 'text'
  | 'video'
  | 'audio'
  | 'code'
  | 'design'
  | 'marketing'
  | 'productivity';

export const BLOG_TARGET_CATEGORY_SLUGS: BlogTargetCategory[] = [
  'image',
  'text',
  'video',
  'audio',
  'code',
  'design',
  'marketing',
  'productivity',
];

export function isBlogTargetCategory(slug: string): slug is BlogTargetCategory {
  return (BLOG_TARGET_CATEGORY_SLUGS as string[]).includes(slug);
}

export interface KeywordItem {
  id: string;
  keyword: string;
  category: string;
  sub_category: string;
}

export interface CtaLink {
  id: string;
  label: string;
  url: string;
  color: CtaColor;
  category_slug?: BlogTargetCategory | null;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_description: string | null;
  tags: string[] | null;
  category: string | null;
  status: BlogPostStatus;
  source: BlogPostSource;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogAutomationSettings {
  id: string;
  is_enabled: boolean;
  publish_schedule: PublishSchedule;
  publish_time: string;
  main_keywords: KeywordItem[] | null;
  cta_links: CtaLink[] | null;
  target_categories: BlogTargetCategory[] | null;
  tone: string;
  post_length: PostLength;
  auto_publish: boolean;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
}
