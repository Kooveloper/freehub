import type { Metadata } from 'next';

import { InquiryForm } from '@/components/inquiry/InquiryForm';

export const metadata: Metadata = {
  title: '문의하기 | FreeHub',
  description: 'FreeHub 이용 중 궁금한 점이나 제안 사항을 보내주세요.',
};

export default function InquiryPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          문의하기
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          궁금한 점이나 제안 사항을 남겨주시면 검토 후 답변드립니다
        </p>
      </div>

      <InquiryForm />
    </div>
  );
}
