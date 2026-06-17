import { NextResponse } from 'next/server';

import { getUserReviewsForAdmin } from '@/lib/supabase/review-queries';
import { createClient } from '@/lib/supabase/server';

/** GET: 현재 유저가 작성한 리뷰 목록 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    const reviews = await getUserReviewsForAdmin(user.id);
    return NextResponse.json({ reviews });
  } catch (error) {
    const message = error instanceof Error ? error.message : '리뷰 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
