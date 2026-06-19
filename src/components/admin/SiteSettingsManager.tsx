'use client';

import { useEffect, useState } from 'react';

import { Toast, useToast } from '@/components/admin/Toast';
import type { SiteSettings } from '@/types/site-settings';

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-gray-700';

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-brand-600' : 'bg-gray-300'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
        />
      </button>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
}

function emptySettings(): Partial<SiteSettings> {
  return {
    ads_enabled: false,
    adsense_publisher_id: '',
    ad_slot_home_top: '',
    ad_slot_in_feed: '',
    ad_slot_sidebar: '',
    ad_slot_detail_btm: '',
    ad_slot_blog_mid: '',
    extra_head_html: '',
    extra_body_html: '',
  };
}

export function SiteSettingsManager() {
  const { toast, showToast, hideToast } = useToast();
  const [values, setValues] = useState<Partial<SiteSettings>>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setValues({ ...emptySettings(), ...data.settings });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? '저장 실패');
      showToast('설정이 저장되었습니다.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '저장 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">불러오는 중…</p>;
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">광고 (AdSense)</h2>
          <div className="space-y-4">
            <Toggle
              checked={Boolean(values.ads_enabled)}
              onChange={(checked) => update('ads_enabled', checked)}
              label="광고 영역 표시"
            />
            <p className="text-xs text-gray-500">
              OFF이거나 Publisher ID가 없으면 모든 광고 영역이 숨겨집니다.
            </p>
            <div>
              <label className={LABEL_CLASS}>AdSense Publisher ID</label>
              <input
                type="text"
                value={values.adsense_publisher_id ?? ''}
                onChange={(e) => update('adsense_publisher_id', e.target.value)}
                placeholder="ca-pub-xxxxxxxxxxxxxxxx"
                className={INPUT_CLASS}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ['ad_slot_home_top', '상단 배너'],
                  ['ad_slot_in_feed', '인피드'],
                  ['ad_slot_sidebar', '사이드바'],
                  ['ad_slot_detail_btm', '상세 하단'],
                  ['ad_slot_blog_mid', '본문 중간'],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className={LABEL_CLASS}>{label} 슬롯 ID</label>
                  <input
                    type="text"
                    value={(values[key] as string) ?? ''}
                    onChange={(e) => update(key, e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-gray-900">
            메타 태그 및 SEO 태그 추가
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            검색엔진 인증, GA, OG 등 필요한 코드를 HTML 그대로 붙여넣으세요.
            사이트 전체(공개·어드민·로그인 등 모든 페이지)의 head/body에
            삽입됩니다.
          </p>
          <div className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>head 상단</label>
              <p className="mb-2 text-xs text-gray-400">
                {'<head>'} 안 최상단에 삽입됩니다. meta, link, script 태그를
                입력하세요.
              </p>
              <textarea
                rows={6}
                value={values.extra_head_html ?? ''}
                onChange={(e) => update('extra_head_html', e.target.value)}
                placeholder={'<meta name="google-site-verification" content="..." />'}
                className={`${INPUT_CLASS} font-mono text-xs`}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>body 상단</label>
              <p className="mb-2 text-xs text-gray-400">
                {'<body>'} 시작 직후에 삽입됩니다. GTM noscript 등.
              </p>
              <textarea
                rows={6}
                value={values.extra_body_html ?? ''}
                onChange={(e) => update('extra_body_html', e.target.value)}
                placeholder={'<noscript>...</noscript>'}
                className={`${INPUT_CLASS} font-mono text-xs`}
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end pb-8">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </form>
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
