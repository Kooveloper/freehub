import { Suspense } from 'react';

import { ToolForm } from '@/components/admin/ToolForm';
import {
  getAdminCategories,
  getAdminSubCategories,
} from '@/lib/supabase/admin-queries';

export const dynamic = 'force-dynamic';

function ToolFormFallback() {
  return (
    <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-400">
      서비스 정보를 불러오는 중…
    </div>
  );
}

export default async function AdminNewToolPage() {
  const [categories, subCategories] = await Promise.all([
    getAdminCategories(),
    getAdminSubCategories(),
  ]);

  return (
    <Suspense fallback={<ToolFormFallback />}>
      <ToolForm categories={categories} subCategories={subCategories} />
    </Suspense>
  );
}
