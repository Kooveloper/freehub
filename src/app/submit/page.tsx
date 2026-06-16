import type { Metadata } from 'next';
import { Suspense } from 'react';

import { SubmitForm } from '@/components/submit/SubmitForm';
import { getToolOptions } from '@/lib/supabase/queries';

export const metadata: Metadata = {
  title: '제보하기 | FreeHub',
  description:
    '새 서비스 제보, 무료 한도 변경 신고, 버그/오류 제보를 보내주세요.',
};

function SubmitFormFallback() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-400">
      제보 양식을 불러오는 중…
    </div>
  );
}

export default async function SubmitPage() {
  const tools = await getToolOptions();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          제보하기
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          FreeHub를 더 정확하고 유용하게 만드는 데 도움을 주세요
        </p>
      </div>

      <Suspense fallback={<SubmitFormFallback />}>
        <SubmitForm tools={tools} />
      </Suspense>
    </div>
  );
}
