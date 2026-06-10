import { Redis } from '@upstash/redis';

/**
 * Upstash Redis 클라이언트
 * 캐싱, Rate Limit 등 서버 사이드 작업에 사용합니다.
 * 환경변수: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 */
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
