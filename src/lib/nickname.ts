const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9_]+$/;

export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 20;

export function normalizeNickname(value: string): string {
  return value.trim();
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
