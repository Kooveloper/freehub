'use client';

import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Toast, useToast } from '@/components/admin/Toast';
import { BlogKeywordSettings } from '@/components/admin/BlogKeywordSettings';
import {
  CATEGORY_EMOJI,
  CTA_COLOR_BADGE_CLASS,
  CTA_COLOR_OPTIONS,
  getDefaultCtaForCategory,
  syncCtaLinksFromCategories,
} from '@/constants/categoryCta';
import { normalizeAutomationSettings } from '@/lib/blog/automation-normalize';
import { normalizePublishHour } from '@/lib/blog/cron-schedule';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/tool';
import type {
  BlogAutomationSettings,
  BlogTargetCategory,
  CtaColor,
  CtaLink,
  PostLength,
  PublishSchedule,
} from '@/types/blog';
import { isBlogTargetCategory } from '@/types/blog';

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

const PUBLISH_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour);

interface BlogAutomationSettingsFormProps {
  categories: Category[];
}

function applyLoadedSettings(
  raw: BlogAutomationSettings,
): BlogAutomationSettings {
  return normalizeAutomationSettings(raw as unknown as Record<string, unknown>);
}

export function BlogAutomationSettingsForm({
  categories,
}: BlogAutomationSettingsFormProps) {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [settings, setSettings] = useState<BlogAutomationSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedCtaIds, setExpandedCtaIds] = useState<Set<string>>(new Set());

  const orderedCategories = useMemo(
    () =>
      categories
        .filter((category) => isBlogTargetCategory(category.slug))
        .sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch('/api/admin/blog/automation');
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? '설정 조회 실패');
        }
        if (!data.settings) {
          throw new Error('설정을 찾을 수 없습니다');
        }

        if (!cancelled) {
          setSettings(applyLoadedSettings(data.settings));
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : '설정을 불러오지 못했습니다',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const update = <K extends keyof BlogAutomationSettings>(
    key: K,
    value: BlogAutomationSettings[K],
  ) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const toggleTargetCategory = (slug: BlogTargetCategory, checked: boolean) => {
    setSettings((prev) => {
      if (!prev) return prev;

      const current = prev.target_categories ?? [];
      const nextSet = new Set(current);

      if (checked) {
        nextSet.add(slug);
      } else {
        nextSet.delete(slug);
      }

      const nextCategories = orderedCategories
        .map((category) => category.slug)
        .filter((categorySlug): categorySlug is BlogTargetCategory =>
          nextSet.has(categorySlug as BlogTargetCategory),
        );

      return {
        ...prev,
        target_categories: nextCategories,
        cta_links: syncCtaLinksFromCategories(nextCategories, prev.cta_links),
      };
    });
  };

  const handleSave = async () => {
    if (!settings) return;

    const normalized = applyLoadedSettings(settings);

    setSaving(true);
    try {
      const res = await fetch('/api/admin/blog/automation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_enabled: normalized.is_enabled,
          publish_schedule: normalized.publish_schedule,
          publish_time: normalized.publish_time,
          main_keywords: normalized.main_keywords,
          cta_links: normalized.cta_links,
          target_categories: normalized.target_categories,
          tone: normalized.tone,
          post_length: normalized.post_length,
          auto_publish: normalized.auto_publish,
          webhook_url: normalized.webhook_url,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '저장 실패');
      setSettings(applyLoadedSettings(data.settings));
      showToast('자동화 설정이 저장되었습니다 ✅', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '저장 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleWebhookTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/blog/webhook-test', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '전송 실패');
      setTestResult('Webhook 전송 성공!');
    } catch (error) {
      setTestResult(error instanceof Error ? error.message : '전송 실패');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">설정을 불러오는 중…</p>;
  }

  if (loadError) {
    return <p className="text-sm text-red-600">{loadError}</p>;
  }

  if (!settings) {
    return null;
  }

  const ctaLinks = settings.cta_links ?? [];
  const keywords = settings.main_keywords ?? [];
  const targetCategories = settings.target_categories ?? [];
  const publishHour = normalizePublishHour(settings.publish_time).split(':')[0];

  const updateCta = (id: string, patch: Partial<CtaLink>) => {
    update(
      'cta_links',
      ctaLinks.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const resetCtaToDefault = (id: string, slug: BlogTargetCategory) => {
    const defaults = getDefaultCtaForCategory(slug);
    updateCta(id, {
      label: defaults.label,
      url: defaults.url,
      color: defaults.color,
      category_slug: slug,
    });
  };

  const toggleCtaExpanded = (id: string) => {
    setExpandedCtaIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6">
        <Card title="자동화 ON/OFF">
          <button
            type="button"
            onClick={() => update('is_enabled', !settings.is_enabled)}
            className={cn(
              'relative h-8 w-14 rounded-full transition-colors',
              settings.is_enabled ? 'bg-green-500' : 'bg-gray-300',
            )}
          >
            <span
              className={cn(
                'absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform',
                settings.is_enabled ? 'left-7' : 'left-1',
              )}
            />
          </button>
          <p
            className={cn(
              'mt-2 text-sm font-medium',
              settings.is_enabled ? 'text-green-700' : 'text-gray-500',
            )}
          >
            {settings.is_enabled ? '자동화 활성화됨' : '자동화 꺼져 있음'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            자동화가 ON이면 설정된 주기에 맞게 n8n webhook이 호출됩니다.
          </p>
        </Card>

        <Card title="발행 스케줄">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            발행 주기
          </label>
          <select
            value={settings.publish_schedule}
            onChange={(e) =>
              update('publish_schedule', e.target.value as PublishSchedule)
            }
            className={cn(INPUT_CLASS, 'mb-3')}
          >
            <option value="daily">매일</option>
            <option value="weekdays">평일만 (월~금)</option>
            <option value="weekly">주 1회 (매주 월요일)</option>
          </select>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            발행 시각 (KST, 정각)
          </label>
          <select
            value={publishHour}
            onChange={(e) =>
              update('publish_time', `${e.target.value.padStart(2, '0')}:00`)
            }
            className={cn(INPUT_CLASS, 'mb-3')}
          >
            {PUBLISH_HOUR_OPTIONS.map((hour) => (
              <option key={hour} value={String(hour).padStart(2, '0')}>
                {String(hour).padStart(2, '0')}:00
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={settings.auto_publish}
              onChange={(e) => update('auto_publish', e.target.checked)}
            />
            자동 발행 (생성 즉시 published)
          </label>
          <p className="mt-1 text-xs text-gray-500">
            OFF면 draft로 저장되어 어드민에서 검토 후 수동 발행합니다.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            발행 시각은 한국 시간(KST) 기준이며, 선택한 시각 정각에 실행됩니다.
          </p>
        </Card>

        <Card title="키워드 설정">
          <BlogKeywordSettings
            categories={categories}
            keywords={keywords}
            onChange={(nextKeywords) => update('main_keywords', nextKeywords)}
          />
        </Card>

        <Card title="CTA 링크 (타겟 카테고리에 따라 자동 생성됨)">
          <p className="mb-3 text-xs font-medium text-gray-600">타겟 카테고리</p>
          <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {orderedCategories.map((cat) => {
              const slug = cat.slug as BlogTargetCategory;
              return (
                <label
                  key={cat.slug}
                  className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={targetCategories.includes(slug)}
                    onChange={(e) => toggleTargetCategory(slug, e.target.checked)}
                  />
                  <span>
                    {CATEGORY_EMOJI[slug]} {cat.name}
                  </span>
                </label>
              );
            })}
          </div>
          <p className="mb-3 text-xs text-gray-500">
            타겟 카테고리를 선택하면 기본 CTA가 자동으로 채워집니다. 각 항목을
            펼쳐 라벨, URL, 색상을 수정할 수 있습니다.
          </p>
          {ctaLinks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
              타겟 카테고리를 선택하면 CTA가 자동으로 생성됩니다.
            </p>
          ) : (
            <div className="space-y-2">
              {ctaLinks.map((cta, index) => {
                const categorySlug =
                  cta.category_slug ?? targetCategories[index] ?? null;
                const isExpanded = expandedCtaIds.has(cta.id);
                const categoryName = categorySlug
                  ? (orderedCategories.find((c) => c.slug === categorySlug)?.name ??
                    categorySlug)
                  : 'CTA';

                return (
                  <div
                    key={cta.id}
                    className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCtaExpanded(cta.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100/80"
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                        )}
                        <span className="shrink-0 font-medium">
                          {categorySlug ? (
                            <>
                              {CATEGORY_EMOJI[categorySlug]} {categoryName}
                            </>
                          ) : (
                            categoryName
                          )}
                        </span>
                        {!isExpanded && cta.label && (
                          <span className="truncate text-xs text-gray-400">
                            {cta.label}
                          </span>
                        )}
                      </button>
                      {categorySlug && (
                        <button
                          type="button"
                          onClick={() => resetCtaToDefault(cta.id, categorySlug)}
                          className="shrink-0 px-3 py-2.5 text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          기본값 복원
                        </button>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="space-y-3 border-t border-gray-200 bg-white px-4 py-4">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600">
                            라벨
                          </label>
                          <input
                            type="text"
                            value={cta.label}
                            onChange={(e) =>
                              updateCta(cta.id, { label: e.target.value })
                            }
                            placeholder="CTA 버튼 텍스트"
                            className={INPUT_CLASS}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600">
                            URL
                          </label>
                          <input
                            type="url"
                            value={cta.url}
                            onChange={(e) =>
                              updateCta(cta.id, { url: e.target.value })
                            }
                            placeholder="https://www.freehub.kr/category/..."
                            className={INPUT_CLASS}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600">
                            색상
                          </label>
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={cta.color}
                              onChange={(e) =>
                                updateCta(cta.id, {
                                  color: e.target.value as CtaColor,
                                })
                              }
                              className={INPUT_CLASS}
                            >
                              {CTA_COLOR_OPTIONS.map((color) => (
                                <option key={color} value={color}>
                                  {color}
                                </option>
                              ))}
                            </select>
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                                CTA_COLOR_BADGE_CLASS[cta.color],
                              )}
                            >
                              {cta.color}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="콘텐츠 설정">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            글 톤
          </label>
          <select
            value={settings.tone}
            onChange={(e) => update('tone', e.target.value)}
            className={cn(INPUT_CLASS, 'mb-3')}
          >
            <option value="friendly">친근하고 쉽게</option>
            <option value="professional">전문적으로</option>
            <option value="concise">간결하게</option>
          </select>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            글 길이
          </label>
          <select
            value={settings.post_length}
            onChange={(e) =>
              update('post_length', e.target.value as PostLength)
            }
            className={INPUT_CLASS}
          >
            <option value="short">짧게 (800~1,000자)</option>
            <option value="medium">보통 (1,500~2,000자)</option>
            <option value="long">길게 (2,500~3,000자)</option>
          </select>
        </Card>

        <Card title="Webhook 설정">
          <input
            type="url"
            value={settings.webhook_url ?? ''}
            onChange={(e) => update('webhook_url', e.target.value)}
            placeholder="https://your-n8n.app/webhook/..."
            className={cn(INPUT_CLASS, 'mb-2')}
          />
          <p className="mb-3 text-xs text-gray-500">
            n8n 또는 Make.com의 Webhook URL을 입력하세요.
          </p>
          <button
            type="button"
            onClick={handleWebhookTest}
            disabled={testing}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Webhook 테스트 전송'
            )}
          </button>
          {testResult && (
            <p
              className={cn(
                'mt-2 text-sm',
                testResult.includes('성공') ? 'text-green-600' : 'text-red-600',
              )}
            >
              {testResult}
            </p>
          )}
          <pre className="mt-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
{`{
  "main_keywords": [
    {
      "id": "uuid",
      "keyword": "무료 배경 제거",
      "category": "image",
      "sub_category": "image-bg-remove"
    }
  ],
  "target_categories": ["image", "text"],
  "cta_links": [{ "label": "...", "url": "...", "color": "blue" }],
  "tone": "friendly",
  "post_length": "medium",
  "auto_publish": true
}`}
          </pre>
        </Card>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : '설정 저장'}
        </button>
      </div>
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}
