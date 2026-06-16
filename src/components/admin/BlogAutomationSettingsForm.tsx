'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Toast, useToast } from '@/components/admin/Toast';
import { CATEGORIES } from '@/constants/categories';
import { cn } from '@/lib/utils';
import type {
  BlogAutomationSettings,
  CtaColor,
  CtaLink,
  PostLength,
  PublishSchedule,
} from '@/types/blog';

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

const CTA_COLORS: CtaColor[] = ['blue', 'green', 'orange', 'purple'];

function newCta(): CtaLink {
  return {
    id: crypto.randomUUID(),
    label: '',
    url: '',
    color: 'blue',
  };
}

export function BlogAutomationSettingsForm() {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [settings, setSettings] = useState<BlogAutomationSettings | null>(null);
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    fetch('/api/admin/blog/automation')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof BlogAutomationSettings>(
    key: K,
    value: BlogAutomationSettings[K],
  ) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const addKeyword = () => {
    const value = keywordInput.trim();
    if (!value || !settings) return;
    const keywords = settings.main_keywords ?? [];
    if (keywords.includes(value)) return;
    update('main_keywords', [...keywords, value]);
    setKeywordInput('');
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/blog/automation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_enabled: settings.is_enabled,
          publish_schedule: settings.publish_schedule,
          publish_time: settings.publish_time,
          main_keywords: settings.main_keywords,
          cta_links: settings.cta_links,
          target_categories: settings.target_categories,
          tone: settings.tone,
          post_length: settings.post_length,
          auto_publish: settings.auto_publish,
          webhook_url: settings.webhook_url,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '저장 실패');
      setSettings(data.settings);
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

  if (loading || !settings) {
    return <p className="text-sm text-gray-500">설정을 불러오는 중…</p>;
  }

  const ctaLinks = settings.cta_links ?? [];
  const keywords = settings.main_keywords ?? [];
  const targetCategories = settings.target_categories ?? [];

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
            발행 시각
          </label>
          <input
            type="time"
            value={settings.publish_time}
            onChange={(e) => update('publish_time', e.target.value)}
            className={cn(INPUT_CLASS, 'mb-3')}
          />
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
        </Card>

        <Card title="키워드 설정">
          <p className="mb-2 text-xs text-gray-500">
            추가된 키워드를 순서대로 순환하며 콘텐츠를 생성합니다.
          </p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700"
              >
                {kw}
                <button
                  type="button"
                  onClick={() =>
                    update(
                      'main_keywords',
                      keywords.filter((k) => k !== kw),
                    )
                  }
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addKeyword();
              }
            }}
            placeholder="무료 배경 제거, 무료 이미지 생성..."
            className={cn(INPUT_CLASS, 'mb-4')}
          />
          <p className="mb-2 text-xs font-medium text-gray-600">타겟 카테고리</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <label
                key={cat.slug}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <input
                  type="checkbox"
                  checked={targetCategories.includes(cat.slug)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      update('target_categories', [...targetCategories, cat.slug]);
                    } else {
                      update(
                        'target_categories',
                        targetCategories.filter((s) => s !== cat.slug),
                      );
                    }
                  }}
                />
                {cat.name}
              </label>
            ))}
          </div>
        </Card>

        <Card title="CTA 링크 설정">
          <p className="mb-3 text-xs text-gray-500">
            블로그 글 내에 이 CTA 버튼들이 자동으로 삽입됩니다. (최대 5개)
          </p>
          <div className="space-y-3">
            {ctaLinks.map((cta, index) => (
              <div
                key={cta.id}
                className="rounded-lg border border-gray-200 p-3 space-y-2"
              >
                <input
                  type="text"
                  value={cta.label}
                  onChange={(e) => {
                    const next = [...ctaLinks];
                    next[index] = { ...cta, label: e.target.value };
                    update('cta_links', next);
                  }}
                  placeholder="라벨 (예: 무료 이미지 툴 보러가기)"
                  className={INPUT_CLASS}
                />
                <input
                  type="url"
                  value={cta.url}
                  onChange={(e) => {
                    const next = [...ctaLinks];
                    next[index] = { ...cta, url: e.target.value };
                    update('cta_links', next);
                  }}
                  placeholder="https://freehub.kr/category/..."
                  className={INPUT_CLASS}
                />
                <div className="flex items-center gap-2">
                  <select
                    value={cta.color}
                    onChange={(e) => {
                      const next = [...ctaLinks];
                      next[index] = {
                        ...cta,
                        color: e.target.value as CtaColor,
                      };
                      update('cta_links', next);
                    }}
                    className={INPUT_CLASS}
                  >
                    {CTA_COLORS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      update(
                        'cta_links',
                        ctaLinks.filter((_, i) => i !== index),
                      )
                    }
                    className="text-sm text-red-600 hover:underline"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
          {ctaLinks.length < 5 && (
            <button
              type="button"
              onClick={() => update('cta_links', [...ctaLinks, newCta()])}
              className="mt-3 text-sm font-medium text-blue-600 hover:underline"
            >
              + CTA 추가
            </button>
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
  "keyword": "오늘의 키워드",
  "category": "image",
  "cta_links": [...],
  "tone": "friendly",
  "length": "medium",
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
