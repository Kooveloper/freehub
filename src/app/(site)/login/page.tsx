import { Suspense } from 'react';

import { LoginForm } from '@/components/auth/LoginForm';
import { getTranslations } from '@/lib/locale';

async function LoginLoadingFallback() {
  const t = await getTranslations();
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <p className="text-sm text-gray-400">{t('auth.loading')}</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoadingFallback />}>
      <LoginForm />
    </Suspense>
  );
}
