export interface ToolReview {
  id: string;
  tool_id: string;
  user_id: string;
  rating: number;
  content: string;
  created_at: string;
  updated_at: string;
  author_nickname: string;
  like_count: number;
  is_liked?: boolean;
  is_own?: boolean;
  tool_name?: string;
  tool_slug?: string;
}

export type ReviewSort = 'latest' | 'recommended';

export interface ReviewListResponse {
  reviews: ToolReview[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    averageRating: number;
    totalReviews: number;
    byRating: Record<number, number>;
  };
  userReview: ToolReview | null;
}
