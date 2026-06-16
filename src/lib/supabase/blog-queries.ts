import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type {
  BlogAutomationSettings,
  BlogPost,
  CtaLink,
} from '@/types/blog';

import { createClient, createStaticClient } from './server';

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function mapPost(row: Record<string, unknown>): BlogPost {
  return row as unknown as BlogPost;
}

function mapSettings(row: Record<string, unknown>): BlogAutomationSettings {
  const cta = row.cta_links;
  return {
    ...(row as unknown as BlogAutomationSettings),
    cta_links: Array.isArray(cta) ? (cta as CtaLink[]) : [],
  };
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) throw new Error(`블로그 글 조회 실패: ${error.message}`);
  return (data ?? []).map(mapPost);
}

export async function getAllBlogPostsAdmin(): Promise<BlogPost[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`블로그 글(관리자) 조회 실패: ${error.message}`);
  return (data ?? []).map(mapPost);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) throw new Error(`블로그 글 조회 실패: ${error.message}`);
  return data ? mapPost(data) : null;
}

export async function getBlogPostByIdAdmin(id: string): Promise<BlogPost | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`블로그 글 조회 실패: ${error.message}`);
  return data ? mapPost(data) : null;
}

export async function getRecentBlogPosts(limit: number): Promise<BlogPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`최근 블로그 글 조회 실패: ${error.message}`);
  return (data ?? []).map(mapPost);
}

export async function getBlogPostsByCategory(
  category: string,
): Promise<BlogPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .eq('category', category)
    .order('published_at', { ascending: false });

  if (error) throw new Error(`카테고리 블로그 글 조회 실패: ${error.message}`);
  return (data ?? []).map(mapPost);
}

export async function getAllBlogSlugs(): Promise<string[]> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('status', 'published');

  if (error) throw new Error(`블로그 slug 조회 실패: ${error.message}`);
  return (data ?? []).map((row) => row.slug as string);
}

export async function incrementBlogViewCount(id: string): Promise<void> {
  const supabase = createServiceClient();
  const { data, error: fetchError } = await supabase
    .from('blog_posts')
    .select('view_count')
    .eq('id', id)
    .single();

  if (fetchError || !data) {
    throw new Error('블로그 글을 찾을 수 없습니다.');
  }

  const { error } = await supabase
    .from('blog_posts')
    .update({ view_count: (data.view_count as number) + 1 })
    .eq('id', id);

  if (error) throw new Error(`조회수 증가 실패: ${error.message}`);
}

export async function getAutomationSettings(): Promise<BlogAutomationSettings> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('blog_automation_settings')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`자동화 설정 조회 실패: ${error.message}`);

  if (!data) {
    const { data: inserted, error: insertError } = await supabase
      .from('blog_automation_settings')
      .insert({})
      .select('*')
      .single();

    if (insertError || !inserted) {
      throw new Error('자동화 설정 초기화 실패');
    }
    return mapSettings(inserted);
  }

  return mapSettings(data);
}

export async function updateAutomationSettings(
  data: Partial<BlogAutomationSettings>,
): Promise<void> {
  const supabase = createServiceClient();
  const current = await getAutomationSettings();

  const { error } = await supabase
    .from('blog_automation_settings')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', current.id);

  if (error) throw new Error(`자동화 설정 저장 실패: ${error.message}`);
}
