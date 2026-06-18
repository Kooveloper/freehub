'use client';

import { usePathname } from 'next/navigation';

import { AdminSidebar } from '@/components/admin/AdminSidebar';

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': '대시보드',
  '/admin/analytics': '조회 통계',
  '/admin/analytics/reviews': '리뷰 통계',
  '/admin/analytics/favorites': '즐겨찾기 통계',
  '/admin/tools': '서비스 관리',
  '/admin/tools/new': '서비스 등록',
  '/admin/categories': '카테고리',
  '/admin/featured': '인기 서비스',
  '/admin/submissions': '요청 관리',
  '/admin/requests': '추가 요청 관리',
  '/admin/users': '회원 관리',
  '/admin/settings': '사이트 설정',
  '/admin/legal': '약관/정책',
  '/admin/blog': '블로그 글 관리',
  '/admin/blog/new': '블로그 글 작성',
  '/admin/blog/automation': '자동화 세팅',
};

function getPageTitle(pathname: string): string {
  const exact = PAGE_TITLES[pathname];
  if (exact) return exact;

  if (
    pathname.startsWith('/admin/tools/') &&
    pathname !== '/admin/tools/new'
  ) {
    return '서비스 수정';
  }

  if (
    pathname.startsWith('/admin/users/') &&
    pathname !== '/admin/users'
  ) {
    return '회원 상세';
  }

  if (
    pathname.startsWith('/admin/blog/preview/')
  ) {
    return '블로그 미리보기';
  }

  if (
    pathname.startsWith('/admin/blog/') &&
    pathname !== '/admin/blog/new' &&
    !pathname.startsWith('/admin/blog/automation')
  ) {
    return '블로그 글 수정';
  }

  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(`${path}/`)) return title;
  }

  return '관리자';
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const title = getPageTitle(pathname);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-gray-200 bg-white px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
