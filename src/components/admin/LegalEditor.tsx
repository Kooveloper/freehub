'use client';

import { useEffect, useState } from 'react';

import { Toast, useToast } from '@/components/admin/Toast';
import type { LegalPageSlug } from '@/types/legal-page';

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-gray-700';

interface LegalEditorProps {
  slug: LegalPageSlug;
  label: string;
  showEffectiveDate?: boolean;
}

export function LegalEditor({
  slug,
  label,
  showEffectiveDate = false,
}: LegalEditorProps) {
  const { toast, showToast, hideToast } = useToast();
  const [contentKo, setContentKo] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/legal/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.page) {
          setContentKo(data.page.content_ko ?? '');
          setContentEn(data.page.content_en ?? '');
          setEffectiveDate(data.page.effective_date ?? '');
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/legal/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_ko: contentKo,
          content_en: contentEn,
          ...(showEffectiveDate ? { effective_date: effectiveDate } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? '저장 실패');
      showToast(`${label}이(가) 저장되었습니다.`, 'success');
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
      <form onSubmit={handleSubmit} className="space-y-4">
        {showEffectiveDate && (
          <div>
            <label className={LABEL_CLASS}>시행일</label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
              className={INPUT_CLASS}
            />
          </div>
        )}
        <div>
          <label className={LABEL_CLASS}>본문 (한국어)</label>
          <textarea
            rows={16}
            value={contentKo}
            onChange={(e) => setContentKo(e.target.value)}
            required
            className={INPUT_CLASS}
            placeholder="섹션 제목은 ## 로 시작, 문단은 빈 줄로 구분"
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>본문 (English)</label>
          <textarea
            rows={16}
            value={contentEn}
            onChange={(e) => setContentEn(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '저장 중…' : '저장'}
        </button>
      </form>
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
