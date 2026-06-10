'use client';

import {
  ExternalLink,
  FileText,
  Folder,
  Home,
  Inbox,
  LogOut,
  MessageSquare,
  Settings,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://freehub.kr';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: '대시보드', icon: Home },
  { href: '/admin/tools', label: '툴 관리', icon: Wrench },
  { href: '/admin/categories', label: '카테고리', icon: Folder },
  { href: '/admin/featured', label: '인기 서비스', icon: TrendingUp },
  { href: '/admin/submissions', label: '제보 관리', icon: Inbox },
  { href: '/admin/requests', label: '요청 관리', icon: MessageSquare },
  { href: '/admin/settings', label: '사이트 설정', icon: Settings },
  { href: '/admin/legal', label: '약관/정책', icon: FileText },
] as const;

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

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
