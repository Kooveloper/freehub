'use client';

import { useState } from 'react';

import { LegalEditor } from '@/components/admin/LegalEditor';

const TABS = [
  { slug: 'privacy' as const, label: '개인정보처리방침' },
  { slug: 'terms' as const, label: '이용약관' },
];

export default function AdminLegalPage() {
  const [active, setActive] = useState<(typeof TABS)[number]['slug']>('privacy');

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.slug}
            type="button"
            onClick={() => setActive(tab.slug)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              active === tab.slug
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <LegalEditor
        slug={active}
        label={TABS.find((t) => t.slug === active)!.label}
        showEffectiveDate={active === 'terms'}
      />
    </div>
  );
}
