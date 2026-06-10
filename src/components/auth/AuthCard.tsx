import { BrandLogo } from '@/components/ui/BrandLogo';

/** 로그인/회원가입 공통 카드 레이아웃 */
export function AuthCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <BrandLogo size="lg" className="text-brand-600" />
          <h1 className="mt-4 text-xl font-semibold text-gray-900">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
