export const ADMIN_COOKIE_NAME = 'admin_token';
/** 브라우저 세션 토큰 유효 시간 (쿠키는 세션 쿠키로만 저장) */
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 8;

async function signPayload(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload),
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** admin_token 생성 (브라우저를 닫으면 세션 쿠키와 함께 로그아웃) */
export async function createAdminToken(): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is not configured');
  }

  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_COOKIE_MAX_AGE;
  const payload = String(expiresAt);
  const signature = await signPayload(payload, secret);

  return `${payload}.${signature}`;
}

/** admin_token 유효성 검증 */
export async function verifyAdminToken(token: string): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = await signPayload(payload, secret);
  if (signature.length !== expected.length) return false;

  let valid = true;
  for (let i = 0; i < signature.length; i++) {
    if (signature[i] !== expected[i]) valid = false;
  }
  if (!valid) return false;

  const expiresAt = Number.parseInt(payload, 10);
  if (Number.isNaN(expiresAt)) return false;

  return Math.floor(Date.now() / 1000) <= expiresAt;
}
