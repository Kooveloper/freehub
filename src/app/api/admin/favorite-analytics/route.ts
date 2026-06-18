import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import type { AnalyticsPeriod } from '@/lib/admin/analytics';
import { getAdminFavoriteAnalytics } from '@/lib/admin/favorite-analytics';

const VALID_PERIODS = new Set<AnalyticsPeriod>([
  '1d',
  '7d',
  '30d',
  '90d',
  'custom',
]);

export async function GET(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get('period') ?? '30d';
  const period = VALID_PERIODS.has(periodParam as AnalyticsPeriod)
    ? (periodParam as AnalyticsPeriod)
    : '30d';
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  try {
    const data = await getAdminFavoriteAnalytics(period, from, to);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '즐겨찾기 통계 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
