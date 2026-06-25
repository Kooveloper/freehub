const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9_]+$/;

export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 20;

export function normalizeNickname(value: string): string {
  return value.trim();
}

/** 리뷰 공개 표시용 — 앞 1자만 보이고 나머지는 * 처리 */
export function maskNicknameForDisplay(nickname: string): string {
  const trimmed = nickname.trim();
  if (trimmed.length <= 1) return trimmed;
  return `${trimmed.slice(0, 1)}${'*'.repeat(trimmed.length - 1)}`;
}

export function validateNickname(value: string): string | null {
  const nickname = normalizeNickname(value);

  if (nickname.length < NICKNAME_MIN_LENGTH || nickname.length > NICKNAME_MAX_LENGTH) {
    return `닉네임은 ${NICKNAME_MIN_LENGTH}~${NICKNAME_MAX_LENGTH}자여야 합니다.`;
  }

  if (!NICKNAME_PATTERN.test(nickname)) {
    return '닉네임은 한글, 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.';
  }

  return null;
}
