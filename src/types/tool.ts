/** 무료 플랜 한도 유형 */
export type FreeLimitType = 'daily' | 'monthly' | 'total' | 'unlimited';

/** AI·SaaS 도구 정보 */
export interface Tool {
  id: string;
  slug: string;
  name: string;
  name_en?: string | null;
  /** 주 분류 (category_assignments[0]과 동기화) */
  category_slug: string;
  /** 주 서브카테고리 (category_assignments[0]과 동기화) */
  sub_category?: string | null;
  /** 다중 카테고리/서브카테고리 분류 */
  category_assignments?: ToolCategoryAssignment[];
  logo_url: string | null;
  homepage_url: string;
  description: string;
  description_en?: string | null;
  free_plan_exists: boolean;
  free_limit_type: FreeLimitType;
  free_limit_amount: number | null;
  free_limit_unit: string | null;
  free_limit_unit_en?: string | null;
  free_description: string | null;
  free_description_en?: string | null;
  free_plan_url: string | null;
  requires_credit_card: boolean;
  free_features: string[];
  free_features_en?: string[];
  paid_only_features: string[];
  paid_only_features_en?: string[];
  signup_methods: string[];
  tags: string[];
  tags_en?: string[];
  tip: string | null;
  tip_en?: string | null;
  is_sponsored: boolean;
  is_verified: boolean;
  verified_date: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

/** 도구 카테고리 */
export interface Category {
  id: string;
  slug: string;
  name: string;
  name_en?: string | null;
  description: string;
  description_en?: string | null;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

/** 서브카테고리 (대카테고리 하위) */
export interface SubCategory {
  id: string;
  slug: string;
  name: string;
  category_slug: string;
  sort_order: number;
  is_active: boolean;
}

/** 툴 ↔ 카테고리/서브카테고리 연결 */
export interface ToolCategoryAssignment {
  id: string;
  tool_id: string;
  category_slug: string;
  sub_category: string | null;
  sort_order: number;
}
