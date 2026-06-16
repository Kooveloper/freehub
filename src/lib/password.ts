export const SIGNUP_PASSWORD_PLACEHOLDER = '비밀번호(영문+숫자 6자 이상)';

export const SIGNUP_PASSWORD_RULE_MESSAGE =
  '비밀번호는 영문과 숫자를 포함해 6자 이상이어야 합니다.';

export function isValidSignupPassword(password: string): boolean {
  return (
    password.length >= 6 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
}
