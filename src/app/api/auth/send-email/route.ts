import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { Webhook } from 'standardwebhooks';

import {
  buildAuthConfirmationUrl,
  buildAuthEmailHtml,
  isAuthEmailAction,
} from '@/lib/email/auth-emails';

const FROM =
  process.env.RESEND_FROM_EMAIL?.includes('<')
    ? process.env.RESEND_FROM_EMAIL
    : `FreeHub <${process.env.RESEND_FROM_EMAIL ?? 'noreply@freehub.kr'}>`;

interface SendEmailHookPayload {
  user: {
    email: string;
    user_metadata?: {
      locale?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

export async function POST(request: Request) {
  const secret = process.env.SEND_EMAIL_HOOK_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!secret || !apiKey || !supabaseUrl) {
    return NextResponse.json(
      { error: 'Email hook is not configured' },
      { status: 500 },
    );
  }

  const payload = await request.text();
  const hookSecret = secret.replace('v1,whsec_', '');
  const headers = Object.fromEntries(request.headers);

  let body: SendEmailHookPayload;
  try {
    const webhook = new Webhook(hookSecret);
    body = webhook.verify(payload, headers) as SendEmailHookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  const action = body.email_data.email_action_type;
  if (!isAuthEmailAction(action)) {
    return NextResponse.json({ error: 'Unsupported email action' }, { status: 400 });
  }

  const locale = body.user.user_metadata?.locale;
  const confirmationUrl = buildAuthConfirmationUrl(supabaseUrl, body.email_data);
  const { subject, html } = buildAuthEmailHtml({
    locale,
    action,
    confirmationUrl,
    token: body.email_data.token,
  });

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: body.user.email,
    subject,
    html,
  });

  if (error) {
    console.error('Auth email send failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({});
}
