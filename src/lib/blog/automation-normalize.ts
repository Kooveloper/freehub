import { syncCtaLinksFromCategories } from '@/constants/categoryCta';
import { normalizePublishHour } from '@/lib/blog/cron-schedule';
import { normalizeMainKeywords } from '@/lib/blog/keyword-items';
import type {
  BlogAutomationSettings,
  BlogTargetCategory,
  PostLength,
  PublishSchedule,
} from '@/types/blog';
import { isBlogTargetCategory } from '@/types/blog';

const PUBLISH_SCHEDULES = new Set<PublishSchedule>(['daily', 'weekdays', 'weekly']);
const POST_LENGTHS = new Set<PostLength>(['short', 'medium', 'long']);

export function normalizeTargetCategories(
  values: unknown,
): BlogTargetCategory[] {
  if (!Array.isArray(values)) return [];
  return values.filter(
    (value): value is BlogTargetCategory =>
      typeof value === 'string' && isBlogTargetCategory(value),
  );
}

export function normalizeAutomationSettings(
  raw: Record<string, unknown>,
): BlogAutomationSettings {
  const targetCategories = normalizeTargetCategories(raw.target_categories);
  const publishSchedule = raw.publish_schedule;
  const postLength = raw.post_length;

  return {
    ...(raw as unknown as BlogAutomationSettings),
    is_enabled: Boolean(raw.is_enabled),
    publish_schedule: PUBLISH_SCHEDULES.has(publishSchedule as PublishSchedule)
      ? (publishSchedule as PublishSchedule)
      : 'daily',
    publish_time: normalizePublishHour(String(raw.publish_time ?? '09:00')),
    main_keywords: normalizeMainKeywords(raw.main_keywords),
    target_categories: targetCategories,
    cta_links: syncCtaLinksFromCategories(
      targetCategories,
      Array.isArray(raw.cta_links) ? raw.cta_links : [],
    ),
    tone: typeof raw.tone === 'string' && raw.tone.trim() ? raw.tone : 'friendly',
    post_length: POST_LENGTHS.has(postLength as PostLength)
      ? (postLength as PostLength)
      : 'medium',
    auto_publish: Boolean(raw.auto_publish),
    webhook_url:
      typeof raw.webhook_url === 'string' && raw.webhook_url.trim()
        ? raw.webhook_url.trim()
        : null,
  };
}

export type AutomationPatchInput = Partial<
  Pick<
    BlogAutomationSettings,
    | 'is_enabled'
    | 'publish_schedule'
    | 'publish_time'
    | 'main_keywords'
    | 'cta_links'
    | 'target_categories'
    | 'tone'
    | 'post_length'
    | 'auto_publish'
    | 'webhook_url'
  >
>;

export function pickAutomationPatch(
  body: Record<string, unknown>,
): AutomationPatchInput {
  const patch: AutomationPatchInput = {};

  if ('is_enabled' in body) patch.is_enabled = Boolean(body.is_enabled);
  if ('publish_schedule' in body) {
    patch.publish_schedule = body.publish_schedule as PublishSchedule;
  }
  if ('publish_time' in body) {
    patch.publish_time = normalizePublishHour(String(body.publish_time ?? ''));
  }
  if ('main_keywords' in body) {
    patch.main_keywords = normalizeMainKeywords(body.main_keywords);
  }
  if ('cta_links' in body) {
    patch.cta_links = Array.isArray(body.cta_links) ? body.cta_links : [];
  }
  if ('target_categories' in body) {
    patch.target_categories = normalizeTargetCategories(body.target_categories);
  }
  if ('tone' in body && typeof body.tone === 'string') {
    patch.tone = body.tone;
  }
  if ('post_length' in body) {
    patch.post_length = body.post_length as PostLength;
  }
  if ('auto_publish' in body) patch.auto_publish = Boolean(body.auto_publish);
  if ('webhook_url' in body) {
    const url = typeof body.webhook_url === 'string' ? body.webhook_url.trim() : '';
    patch.webhook_url = url || null;
  }

  return patch;
}
