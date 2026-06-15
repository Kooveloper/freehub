/** OAuth·이메일 인증 후 돌아올 앱 origin (로컬은 현재 origin, 운영은 NEXT_PUBLIC_APP_URL 우선) */
export function resolveAppOrigin(requestOrigin?: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    const { origin, hostname } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (isLocal) return origin;
    if (configured) return configured;
    return origin;
  }

  if (requestOrigin) {
    const host = new URL(requestOrigin).hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    if (isLocal) return requestOrigin.replace(/\/$/, '');
  }

  if (configured) return configured;
  return requestOrigin?.replace(/\/$/, '') ?? 'https://freehub.kr';
}

export function buildAuthCallbackUrl(next = '/'): string {
  const safeNext = next.startsWith('/') ? next : '/';
  return `${resolveAppOrigin()}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

export function getOAuthCallbackErrorMessage(
  error: string | null,
  errorCode: string | null,
): string {
  if (errorCode === 'flow_state_already_used') {
    return '로그인 요청이 중복되었습니다. Google 계정 선택은 한 번만 눌러주세요.';
  }
  if (errorCode === 'flow_state_not_found' || errorCode === 'flow_state_expired') {
    return '로그인 세션이 만료되었습니다. 다시 시도해주세요.';
  }
  if (error === 'auth_callback_error') {
    return '로그인에 실패했습니다. 다시 시도해주세요.';
  }
  return '';
}
