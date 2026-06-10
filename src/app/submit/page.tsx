import type { Metadata } from 'next';

import { SubmitForm } from '@/components/submit/SubmitForm';
import { getToolOptions } from '@/lib/supabase/queries';

export const metadata: Metadata = {
  title: '제보하기 | FreeHub',
  description:
    '새 툴 제보, 무료 한도 변경 신고, 버그/오류 제보를 보내주세요.',
};

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

      <SubmitForm tools={tools} />
    </div>
  );
}
