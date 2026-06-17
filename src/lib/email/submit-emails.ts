import { Resend } from 'resend';

import type {
  BugPayload,
  InquiryPayload,
  LimitChangePayload,
  NewToolPayload,
  SubmissionType,
} from '@/types/submission';

const FROM = 'FreeHub <noreply@freehub.kr>';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getToolLabel(
  type: SubmissionType,
  payload:
    | NewToolPayload
    | LimitChangePayload
    | BugPayload
    | InquiryPayload,
): string {
  switch (type) {
    case 'new_tool':
      return (payload as NewToolPayload).toolName;
    case 'limit_change':
      return (payload as LimitChangePayload).toolName;
    case 'bug':
      return '버그/오류';
    case 'inquiry':
      return (payload as InquiryPayload).title;
  }
}

function buildAdminHtml(
  type: SubmissionType,
  payload:
    | NewToolPayload
    | LimitChangePayload
    | BugPayload
    | InquiryPayload,
  email?: string,
): string {
  const typeLabel =
    type === 'new_tool'
      ? '새 서비스 요청'
      : type === 'limit_change'
        ? '한도 변경 신고'
        : type === 'bug'
          ? '버그/오류 신고'
          : '문의';

  let details = `<p><strong>유형:</strong> ${escapeHtml(typeLabel)}</p>`;

  if (type === 'new_tool') {
    const p = payload as NewToolPayload;
    details += `
      <p><strong>서비스 이름:</strong> ${escapeHtml(p.toolName)}</p>
      <p><strong>URL:</strong> <a href="${escapeHtml(p.url)}">${escapeHtml(p.url)}</a></p>`;
    if (p.freeLimit) {
      details += `<p><strong>무료 한도:</strong> ${escapeHtml(p.freeLimit)}</p>`;
    }
    if (p.description) {
      details += `
      <p><strong>설명:</strong></p>
      <p>${escapeHtml(p.description).replace(/\n/g, '<br>')}</p>`;
    }
  } else if (type === 'limit_change') {
    const p = payload as LimitChangePayload;
    details += `
      <p><strong>서비스:</strong> ${escapeHtml(p.toolName)}</p>
      <p><strong>변경 내용:</strong></p>
      <p>${escapeHtml(p.changeContent).replace(/\n/g, '<br>')}</p>`;
  } else if (type === 'inquiry') {
    const p = payload as InquiryPayload;
    details += `
      <p><strong>제목:</strong> ${escapeHtml(p.title)}</p>
      <p><strong>내용:</strong></p>
      <p>${escapeHtml(p.content).replace(/\n/g, '<br>')}</p>`;
  } else {
    const p = payload as BugPayload;
    details += `
      <p><strong>오류 내용:</strong></p>
      <p>${escapeHtml(p.description).replace(/\n/g, '<br>')}</p>`;
    if (p.pageUrl) {
      details += `<p><strong>페이지 URL:</strong> <a href="${escapeHtml(p.pageUrl)}">${escapeHtml(p.pageUrl)}</a></p>`;
    }
  }

  if (email) {
    details += `<p><strong>답변 이메일:</strong> ${escapeHtml(email)}</p>`;
  }

  return `
    <!DOCTYPE html>
    <html lang="ko">
      <body style="font-family:sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#2563eb;margin-bottom:16px">새 요청이 접수되었습니다</h2>
        ${details}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">FreeHub 관리자 알림</p>
      </body>
    </html>`;
}

/** 관리자 제보 알림 이메일 발송 */
export async function sendSubmissionEmails(
  type: SubmissionType,
  payload:
    | NewToolPayload
    | LimitChangePayload
    | BugPayload
    | InquiryPayload,
  submitterEmail?: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.RESEND_ADMIN_EMAIL;

  if (!apiKey || !adminEmail) {
    console.warn('Resend 설정 없음 — 이메일 발송 건너뜀');
    return;
  }

  const resend = new Resend(apiKey);
  const toolLabel = getToolLabel(type, payload);

  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `[FreeHub] 새 요청: ${toolLabel}`,
    html: buildAdminHtml(type, payload, submitterEmail),
  });
}
