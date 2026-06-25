import { NextResponse } from 'next/server';

import { getProfileByUserId } from '@/lib/supabase/profiles';
import { getToolReviews } from '@/lib/supabase/review-queries';
import { createClient } from '@/lib/supabase/server';
import type { ReviewSort } from '@/types/review';

async function getOptionalUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** GET: ?toolId=&page=&sort=latest|recommended&rating= */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const toolId = searchParams.get('toolId');

  if (!toolId) {
    return NextResponse.json({ error: 'toolId가 필요합니다.' }, { status: 400 });
  }

  const page = Number(searchParams.get('page') ?? '1');
  const sortParam = searchParams.get('sort') ?? 'latest';
  const sort: ReviewSort = sortParam === 'recommended' ? 'recommended' : 'latest';
  const ratingParam = searchParams.get('rating');
  const rating = ratingParam ? Number(ratingParam) : null;

  if (rating !== null && (Number.isNaN(rating) || rating < 1 || rating > 5)) {
    return NextResponse.json({ error: '별점 필터가 올바르지 않습니다.' }, { status: 400 });
  }

  try {
    const user = await getOptionalUser();
    const data = await getToolReviews({
      toolId,
      page: Number.isNaN(page) ? 1 : page,
      sort,
      rating,
      currentUserId: user?.id ?? null,
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : '리뷰 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST: { toolId, rating, content } */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const profile = await getProfileByUserId(supabase, user.id);
  if (!profile) {
    return NextResponse.json(
      { error: '닉네임 설정이 필요합니다.', code: 'PROFILE_REQUIRED' },
      { status: 400 },
    );
  }

  const body = await request.json();
  const toolId = body?.toolId as string | undefined;
  const rating = Number(body?.rating);
  const content = String(body?.content ?? '').trim();

  if (!toolId) {
    return NextResponse.json({ error: 'toolId가 필요합니다.' }, { status: 400 });
  }
  if (Number.isNaN(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: '별점은 1~5 사이여야 합니다.' }, { status: 400 });
  }
  if (content.length > 2000) {
    return NextResponse.json({ error: '리뷰는 2000자 이하로 작성해 주세요.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('tool_reviews')
    .insert({
      tool_id: toolId,
      user_id: user.id,
      rating,
      content,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: '이미 리뷰를 작성하셨습니다.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
