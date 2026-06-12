import {
  getPeriodViewCountMaps,
  type AnalyticsDateRange,
} from '@/lib/admin/analytics';

export interface AdminPeriodViews {
  range: AnalyticsDateRange;
  byTool: Record<string, number>;
  byCategory: Record<string, number>;
  bySubCategory: Record<string, number>;
}

const EMPTY: AdminPeriodViews = {
  range: { period: '30d', from: '', to: '' },
  byTool: {},
  byCategory: {},
  bySubCategory: {},
};

/** 관리자 목록용 30일 조회수 (테이블 미적용 시 빈 맵) */
export async function getAdminPeriodViews30d(): Promise<AdminPeriodViews> {
  try {
    const { range, byTool, byCategory, bySubCategory } =
      await getPeriodViewCountMaps('30d');
    return { range, byTool, byCategory, bySubCategory };
  } catch (error) {
    console.error('기간별 조회수 조회 실패:', error);
    return EMPTY;
  }
}
