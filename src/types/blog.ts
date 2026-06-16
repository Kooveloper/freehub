export type BlogPostStatus = 'draft' | 'published';
export type BlogPostSource = 'manual' | 'auto';
export type PublishSchedule = 'daily' | 'weekdays' | 'weekly';
export type PostLength = 'short' | 'medium' | 'long';
export type CtaColor = 'blue' | 'green' | 'orange' | 'purple';

export interface CtaLink {
  id: string;
  label: string;
  url: string;
  color: CtaColor;
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
  main_keywords: string[] | null;
  cta_links: CtaLink[] | null;
  target_categories: string[] | null;
  tone: string;
  post_length: PostLength;
  auto_publish: boolean;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
}
