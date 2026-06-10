'use client';

import { useEffect, useState } from 'react';

import { Toast, useToast } from '@/components/admin/Toast';
import type { SiteSettings } from '@/types/site-settings';

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

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
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
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
    ga_measurement_id: '',
    google_site_verification: '',
    naver_site_verification: '',
    bing_site_verification: '',
    site_name: '',
    meta_title_ko: '',
    meta_title_en: '',
    meta_description_ko: '',
    meta_description_en: '',
    og_title_ko: '',
    og_title_en: '',
    og_description_ko: '',
    og_description_en: '',
    og_image_url: '',
    favicon_url: '',
    extra_head_html: '',
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
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            분석 · 검색엔진 등록
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Google Analytics (GA4) ID</label>
              <input
                type="text"
                value={values.ga_measurement_id ?? ''}
                onChange={(e) => update('ga_measurement_id', e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Google Search Console 인증</label>
              <input
                type="text"
                value={values.google_site_verification ?? ''}
                onChange={(e) =>
                  update('google_site_verification', e.target.value)
                }
                placeholder="google-site-verification content"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Naver 서치어드바이저 인증</label>
              <input
                type="text"
                value={values.naver_site_verification ?? ''}
                onChange={(e) =>
                  update('naver_site_verification', e.target.value)
                }
                placeholder="naver-site-verification content"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Bing Webmaster 인증</label>
              <input
                type="text"
                value={values.bing_site_verification ?? ''}
                onChange={(e) => update('bing_site_verification', e.target.value)}
                placeholder="msvalidate.01 content"
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">SEO · 메타 · OG</h2>
          <div className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>사이트명</label>
              <input
                type="text"
                value={values.site_name ?? ''}
                onChange={(e) => update('site_name', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS}>기본 제목 (한국어)</label>
                <input
                  type="text"
                  value={values.meta_title_ko ?? ''}
                  onChange={(e) => update('meta_title_ko', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>기본 제목 (English)</label>
                <input
                  type="text"
                  value={values.meta_title_en ?? ''}
                  onChange={(e) => update('meta_title_en', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS}>메타 설명 (한국어)</label>
              <textarea
                rows={3}
                value={values.meta_description_ko ?? ''}
                onChange={(e) => update('meta_description_ko', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>메타 설명 (English)</label>
              <textarea
                rows={3}
                value={values.meta_description_en ?? ''}
                onChange={(e) => update('meta_description_en', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS}>OG 제목 (한국어)</label>
                <input
                  type="text"
                  value={values.og_title_ko ?? ''}
                  onChange={(e) => update('og_title_ko', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>OG 제목 (English)</label>
                <input
                  type="text"
                  value={values.og_title_en ?? ''}
                  onChange={(e) => update('og_title_en', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS}>OG 설명 (한국어)</label>
              <textarea
                rows={2}
                value={values.og_description_ko ?? ''}
                onChange={(e) => update('og_description_ko', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>OG 설명 (English)</label>
              <textarea
                rows={2}
                value={values.og_description_en ?? ''}
                onChange={(e) => update('og_description_en', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS}>파비콘 URL</label>
                <input
                  type="url"
                  value={values.favicon_url ?? ''}
                  onChange={(e) => update('favicon_url', e.target.value)}
                  placeholder="https://..."
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>OG 이미지 URL</label>
                <input
                  type="url"
                  value={values.og_image_url ?? ''}
                  onChange={(e) => update('og_image_url', e.target.value)}
                  placeholder="https://..."
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS}>추가 head HTML (고급)</label>
              <textarea
                rows={4}
                value={values.extra_head_html ?? ''}
                onChange={(e) => update('extra_head_html', e.target.value)}
                placeholder="추가 meta/script 태그 (선택)"
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end pb-8">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </form>
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
