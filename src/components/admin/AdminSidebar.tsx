'use client';

import {
  BarChart3,
  ExternalLink,
  FileText,
  Folder,
  Home,
  Inbox,
  LogOut,
  MessageSquare,
  NotebookPen,
  Settings,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://freehub.kr';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: '대시보드', icon: Home },
  { href: '/admin/tools', label: '서비스 관리', icon: Wrench },
  { href: '/admin/categories', label: '카테고리', icon: Folder },
  { href: '/admin/featured', label: '인기 서비스', icon: TrendingUp },
  { href: '/admin/submissions', label: '요청 관리', icon: Inbox },
  { href: '/admin/requests', label: '추가 요청 관리', icon: MessageSquare },
  { href: '/admin/users', label: '회원 관리', icon: Users },
  { href: '/admin/settings', label: '사이트 설정', icon: Settings },
  { href: '/admin/legal', label: '약관/정책', icon: FileText },
] as const;

const ANALYTICS_ITEMS = [
  { href: '/admin/analytics', label: '조회 통계' },
  { href: '/admin/analytics/reviews', label: '리뷰 통계' },
] as const;

const BLOG_ITEMS = [
  { href: '/admin/blog', label: '블로그 글 관리' },
  { href: '/admin/blog/automation', label: '자동화 세팅' },
] as const;

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const analyticsActive = pathname.startsWith('/admin/analytics');
  const blogActive = pathname.startsWith('/admin/blog');

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-slate-900 lg:flex">
      <div className="border-b border-slate-800 px-5 py-6">
        <Link
          href="/admin/dashboard"
          className="text-lg font-extrabold uppercase tracking-tight text-white transition-colors hover:text-brand-300"
        >
          FREEHUB
          <span className="ml-1.5 text-xs font-semibold uppercase tracking-wider text-brand-300/80">
            Admin
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        <div className="pt-3">
          <p className="mb-1 flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <BarChart3 className="h-3.5 w-3.5" />
            통계
          </p>
          {ANALYTICS_ITEMS.map(({ href, label }) => {
            const active =
              href === '/admin/analytics'
                ? pathname === '/admin/analytics'
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg py-2 pl-9 pr-3 text-sm font-medium transition-colors',
                  active
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
                  analyticsActive && !active && 'text-slate-400',
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="pt-3">
          <p className="mb-1 flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <NotebookPen className="h-3.5 w-3.5" />
            블로그
          </p>
          {BLOG_ITEMS.map(({ href, label }) => {
            const active =
              href === '/admin/blog'
                ? pathname === '/admin/blog' ||
                  (pathname.startsWith('/admin/blog/') &&
                    !pathname.startsWith('/admin/blog/automation'))
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg py-2 pl-9 pr-3 text-sm font-medium transition-colors',
                  active
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
                  blogActive && !active && 'text-slate-400',
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="space-y-1 border-t border-slate-800 px-3 py-4">
        <a
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-white"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          사이트 보기
        </a>
        <a
          href="/api/admin/logout"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-white"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          로그아웃
        </a>
      </div>
    </aside>
  );
}
