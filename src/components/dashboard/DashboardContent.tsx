'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { ToolCard } from '@/components/tools/ToolCard';
import { useFavorites } from '@/hooks/useFavorites';
import type { Tool } from '@/types/tool';

interface DashboardContentProps {
  displayName: string;
  initialTools: Tool[];
}

/** 마이페이지 본문 — 즐겨찾기 실시간 반영 */
export function DashboardContent({
  displayName,
  initialTools,
}: DashboardContentProps) {
  const { favorites, isLoading } = useFavorites();

  const favoriteTools = useMemo(() => {
    if (isLoading) {
      return initialTools;
    }

    const toolMap = new Map(initialTools.map((tool) => [tool.id, tool]));
    return favorites
      .map((id) => toolMap.get(id))
      .filter((tool): tool is Tool => tool != null);
  }, [initialTools, favorites, isLoading]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* 상단 인사 */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          안녕하세요, {displayName}님 👋
        </h1>
        <p className="mt-2 text-gray-500">
          즐겨찾기{' '}
          <span className="font-semibold text-blue-600">
            {favoriteTools.length}
          </span>
          개
        </p>
      </div>

      {/* 즐겨찾기 섹션 */}
      <section>
        <h2 className="mb-6 text-xl font-bold text-gray-900">
          ⭐ 내 즐겨찾기
        </h2>

        {favoriteTools.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
            <p className="text-gray-600">
              아직 즐겨찾기한 툴이 없어요.
              <br />
              마음에 드는 툴에 ♥를 눌러보세요!
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex h-[60px] items-center justify-center rounded-xl bg-blue-600 px-6 text-base font-semibold text-white transition-colors hover:bg-blue-700"
            >
              툴 둘러보기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} favoriteIds={favorites} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
