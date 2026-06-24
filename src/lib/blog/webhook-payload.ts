import { normalizeMainKeywords } from '@/lib/blog/keyword-items';
import type { BlogAutomationSettings } from '@/types/blog';

export function buildBlogWebhookPayload(settings: BlogAutomationSettings) {
  return {
    main_keywords: normalizeMainKeywords(settings.main_keywords),
    target_categories: settings.target_categories ?? [],
    cta_links: settings.cta_links ?? [],
    tone: settings.tone,
    post_length: settings.post_length,
    auto_publish: settings.auto_publish,
  };
}
