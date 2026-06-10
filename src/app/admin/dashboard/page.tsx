import { FolderPlus, Layers, MessageSquare, Plus, Wrench } from 'lucide-react';
import Link from 'next/link';
import type { ComponentType } from 'react';

import { Badge } from '@/components/ui/Badge';
import { ADMIN_STATUS_LABELS, isAdminItemStatus } from '@/constants/admin-status';
import { CATEGORIES } from '@/constants/categories';
import {
  getAdminDashboardData,
  type AdminSubmission,
  type AdminToolRequest,
} from '@/lib/supabase/admin-queries';
import { formatDate } from '@/lib/utils';
import type { Tool } from '@/types/tool';

export const dynamic = 'force-dynamic';

const SUBMISSION_TYPE_LABELS: Record<AdminSubmission['type'], string> = {
  new_tool: '새 툴',
  limit_change: '한도 변경',
  bug: '버그 신고',
};

const STATUS_LABELS = ADMIN_STATUS_LABELS;

function getCategoryName(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

function getSubmissionSummary(submission: AdminSubmission): string {
  if (submission.tool_name) return submission.tool_name;
  return submission.description;
}

function truncate(text: string, max = 60) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {value.toLocaleString('ko-KR')}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-8 text-center text-sm text-gray-400"
      >
        {message}
      </td>
    </tr>
  );
}

export default async function AdminDashboardPage() {
  const { stats, recentTools, pendingSubmissions, pendingRequests } =
    await getAdminDashboardData();

  return (
    <div className="space-y-8">
      {/* 통계 카드 */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="전체 툴"
          value={stats.toolCount}
          icon={Wrench}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="카테고리"
          value={stats.categoryCount}
          icon={Layers}
          accent="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="미처리 제보"
          value={stats.pendingSubmissionCount}
          icon={FolderPlus}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="미처리 요청"
          value={stats.pendingRequestCount}
          icon={MessageSquare}
          accent="bg-rose-50 text-rose-600"
        />
      </section>

      {/* 빠른 액션 */}
      <section className="flex flex-wrap gap-3">
        <Link
          href="/admin/tools/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          새 툴 추가
        </Link>
        <Link
          href="/admin/categories"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Layers className="h-4 w-4" />
          카테고리 관리
        </Link>
      </section>

      {/* 최근 추가 툴 */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">최근 추가 툴</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">서비스명</th>
                <th className="px-5 py-3 font-medium">카테고리</th>
                <th className="px-5 py-3 font-medium">추가일</th>
                <th className="px-5 py-3 font-medium">검증</th>
              </tr>
            </thead>
            <tbody>
              {recentTools.length === 0 ? (
                <EmptyRow colSpan={4} message="등록된 툴이 없습니다." />
              ) : (
                recentTools.map((tool: Tool) => (
                  <tr
                    key={tool.id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {tool.name}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {getCategoryName(tool.category_slug)}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {formatDate(tool.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={tool.is_verified ? 'green' : 'gray'}>
                        {tool.is_verified ? '검증됨' : '미검증'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 미처리 제보 / 요청 */}
      <section className="grid gap-6 lg:grid-cols-2">
        <PendingList
          title="미처리 제보"
          viewAllHref="/admin/submissions"
          items={pendingSubmissions.map((item) => ({
            id: item.id,
            summary: truncate(getSubmissionSummary(item)),
            subLabel: SUBMISSION_TYPE_LABELS[item.type],
            date: item.created_at,
            status: item.status,
          }))}
          emptyMessage="미처리 제보가 없습니다."
        />
        <PendingList
          title="미처리 요청"
          viewAllHref="/admin/requests"
          items={pendingRequests.map((item: AdminToolRequest) => ({
            id: item.id,
            summary: truncate(item.title),
            subLabel: truncate(item.content, 40),
            date: item.created_at,
            status: item.status,
          }))}
          emptyMessage="미처리 요청이 없습니다."
        />
      </section>
    </div>
  );
}

function PendingList({
  title,
  viewAllHref,
  items,
  emptyMessage,
}: {
  title: string;
  viewAllHref: string;
  items: {
    id: string;
    summary: string;
    subLabel: string;
    date: string;
    status: string;
  }[];
  emptyMessage: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <Link
          href={viewAllHref}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          전체 보기
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-gray-400">
          {emptyMessage}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={viewAllHref}
                className="block px-5 py-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {item.summary}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {item.subLabel}
                    </p>
                  </div>
                  <Badge variant="yellow">
                    {isAdminItemStatus(item.status)
                      ? STATUS_LABELS[item.status]
                      : item.status}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  {formatDate(item.date)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
