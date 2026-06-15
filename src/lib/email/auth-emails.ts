import type { Locale } from '@/i18n/config';
import { resolveLocale } from '@/i18n/config';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'FreeHub';

type AuthEmailAction =
  | 'signup'
  | 'recovery'
  | 'invite'
  | 'magiclink'
  | 'email_change'
  | 'email_change_new'
  | 'reauthentication';

interface AuthEmailContent {
  subject: string;
  preview: string;
  title: string;
  body: string;
  cta: string;
  footer: string;
}

const COPY: Record<Locale, Record<AuthEmailAction, AuthEmailContent>> = {
  ko: {
    signup: {
      subject: `${APP_NAME} 이메일 인증을 완료해주세요`,
      preview: '가입을 마치려면 아래 버튼을 눌러 이메일을 인증해주세요.',
      title: '이메일 인증이 필요해요',
      body: '거의 다 왔어요! 아래 버튼을 눌러 이메일을 인증하면 FreeHub 회원가입이 완료됩니다.',
      cta: '이메일 인증하기',
      footer: '본인이 가입하지 않았다면 이 메일을 무시하셔도 됩니다.',
    },
    recovery: {
      subject: `${APP_NAME} 비밀번호 재설정`,
      preview: '비밀번호 재설정 링크입니다.',
      title: '비밀번호를 재설정해주세요',
      body: '비밀번호 재설정 요청을 받았습니다. 아래 버튼을 눌러 새 비밀번호를 설정하세요.',
      cta: '비밀번호 재설정',
      footer: '요청하지 않으셨다면 이 메일을 무시하셔도 됩니다.',
    },
    invite: {
      subject: `${APP_NAME} 초대장이 도착했어요`,
      preview: '초대를 수락하고 계정을 만드세요.',
      title: 'FreeHub 초대',
      body: 'FreeHub에 초대되었습니다. 아래 버튼을 눌러 계정을 만드세요.',
      cta: '초대 수락하기',
      footer: '본인이 요청하지 않은 초대라면 무시하셔도 됩니다.',
    },
    magiclink: {
      subject: `${APP_NAME} 로그인 링크`,
      preview: '아래 버튼으로 로그인하세요.',
      title: '로그인 링크',
      body: '아래 버튼을 눌러 로그인하세요. 링크는 곧 만료되며 한 번만 사용할 수 있습니다.',
      cta: '로그인하기',
      footer: '본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.',
    },
    email_change: {
      subject: `${APP_NAME} 이메일 변경 확인`,
      preview: '이메일 변경을 확인해주세요.',
      title: '이메일 변경 확인',
      body: '아래 버튼을 눌러 이메일 변경을 확인해주세요.',
      cta: '이메일 변경 확인',
      footer: '요청하지 않으셨다면 이 메일을 무시하셔도 됩니다.',
    },
    email_change_new: {
      subject: `${APP_NAME} 새 이메일 확인`,
      preview: '새 이메일 주소를 확인해주세요.',
      title: '새 이메일 확인',
      body: '아래 버튼을 눌러 새 이메일 주소를 확인해주세요.',
      cta: '새 이메일 확인',
      footer: '요청하지 않으셨다면 이 메일을 무시하셔도 됩니다.',
    },
    reauthentication: {
      subject: `${APP_NAME} 인증 코드`,
      preview: '인증 코드를 입력해주세요.',
      title: '인증 코드',
      body: '아래 인증 코드를 입력해주세요.',
      cta: '',
      footer: '요청하지 않으셨다면 이 메일을 무시하셔도 됩니다.',
    },
  },
  en: {
    signup: {
      subject: `Confirm your email for ${APP_NAME}`,
      preview: 'Tap the button below to verify your email and finish signing up.',
      title: 'Verify your email',
      body: 'You are almost there. Confirm your email address to complete your FreeHub account.',
      cta: 'Verify email',
      footer: 'If you did not sign up, you can safely ignore this email.',
    },
    recovery: {
      subject: `Reset your ${APP_NAME} password`,
      preview: 'Use the link below to reset your password.',
      title: 'Reset your password',
      body: 'We received a request to reset your password. Use the button below to choose a new one.',
      cta: 'Reset password',
      footer: 'If you did not request this, you can safely ignore this email.',
    },
    invite: {
      subject: `You are invited to ${APP_NAME}`,
      preview: 'Accept your invitation to create an account.',
      title: 'You are invited',
      body: 'You have been invited to join FreeHub. Use the button below to accept.',
      cta: 'Accept invitation',
      footer: 'If you were not expecting this invitation, you can ignore this email.',
    },
    magiclink: {
      subject: `Your ${APP_NAME} sign-in link`,
      preview: 'Use the button below to sign in.',
      title: 'Sign in to FreeHub',
      body: 'Use the button below to sign in. This link expires soon and works only once.',
      cta: 'Sign in',
      footer: 'If you did not request this, you can safely ignore this email.',
    },
    email_change: {
      subject: `Confirm your ${APP_NAME} email change`,
      preview: 'Confirm your email change request.',
      title: 'Confirm email change',
      body: 'Use the button below to confirm your email change.',
      cta: 'Confirm email change',
      footer: 'If you did not request this, you can safely ignore this email.',
    },
    email_change_new: {
      subject: `Confirm your new ${APP_NAME} email`,
      preview: 'Confirm your new email address.',
      title: 'Confirm new email',
      body: 'Use the button below to confirm your new email address.',
      cta: 'Confirm new email',
      footer: 'If you did not request this, you can safely ignore this email.',
    },
    reauthentication: {
      subject: `Your ${APP_NAME} verification code`,
      preview: 'Enter your verification code.',
      title: 'Verification code',
      body: 'Enter the verification code below.',
      cta: '',
      footer: 'If you did not request this, you can safely ignore this email.',
    },
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildAuthConfirmationUrl(
  supabaseUrl: string,
  emailData: {
    token_hash: string;
    email_action_type: string;
    redirect_to: string;
  },
): string {
  const params = new URLSearchParams({
    token: emailData.token_hash,
    type: emailData.email_action_type,
    redirect_to: emailData.redirect_to,
  });

  return `${supabaseUrl.replace(/\/$/, '')}/auth/v1/verify?${params.toString()}`;
}

export function buildAuthEmailHtml({
  locale,
  action,
  confirmationUrl,
  token,
}: {
  locale: string | undefined;
  action: AuthEmailAction;
  confirmationUrl: string;
  token?: string;
}): { subject: string; html: string } {
  const resolvedLocale = resolveLocale(locale);
  const copy = COPY[resolvedLocale][action] ?? COPY[resolvedLocale].signup;

  const ctaBlock =
    action === 'reauthentication'
      ? `<p style="margin:24px 0 0;font-size:28px;font-weight:700;letter-spacing:0.2em;color:#111827;text-align:center;">${escapeHtml(token ?? '')}</p>`
      : `<a href="${escapeHtml(confirmationUrl)}" style="display:inline-block;margin-top:28px;padding:14px 28px;border-radius:12px;background:#111827;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">${escapeHtml(copy.cta)}</a>`;

  const html = `<!DOCTYPE html>
<html lang="${resolvedLocale}">
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(copy.preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 12px;">
                <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;">${escapeHtml(APP_NAME)}</p>
                <h1 style="margin:12px 0 0;font-size:28px;line-height:1.3;font-weight:800;color:#111827;">${escapeHtml(copy.title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <p style="margin:0;font-size:16px;line-height:1.7;color:#4b5563;">${escapeHtml(copy.body)}</p>
                <div style="text-align:center;">${ctaBlock}</div>
                <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#9ca3af;">${escapeHtml(copy.footer)}</p>
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} ${escapeHtml(APP_NAME)}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject: copy.subject, html };
}

export function isAuthEmailAction(value: string): value is AuthEmailAction {
  return [
    'signup',
    'recovery',
    'invite',
    'magiclink',
    'email_change',
    'email_change_new',
    'reauthentication',
  ].includes(value);
}
