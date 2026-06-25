import { revalidatePath } from 'next/cache';

/** 블로그 목록·상세·홈 ISR 캐시 무효화 */
export function invalidateBlogCache(slug?: string | null) {
  revalidatePath('/blog');
  revalidatePath('/');

  const normalized = slug?.trim();
  if (normalized) {
    revalidatePath(`/blog/${normalized}`);
  }
}
