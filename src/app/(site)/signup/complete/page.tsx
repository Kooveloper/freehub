import { Suspense } from 'react';

import { CompleteProfileForm } from '@/components/auth/CompleteProfileForm';

export default function CompleteProfilePage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Suspense fallback={<p className="text-center text-sm text-gray-500">로딩 중…</p>}>
          <CompleteProfileForm />
        </Suspense>
      </div>
    </div>
  );
}
