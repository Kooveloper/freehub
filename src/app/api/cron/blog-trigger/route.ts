import { NextResponse } from 'next/server';

import {
  getKstTimeLabel,
  matchesPublishSchedule,
  matchesPublishTime,
} from '@/lib/blog/cron-schedule';
import { buildBlogWebhookPayload } from '@/lib/blog/webhook-payload';
import { getAutomationSettings } from '@/lib/supabase/blog-queries';

export const dynamic = 'force-dynamic';

/**
 * Vercel Cron → n8n 등 외부 웹훅으로 블로그 자동화 트리거.
 *
 * Vercel 프로젝트 환경변수에도 로컬과 동일한 CRON_SECRET을 추가하세요.
 * (Settings → Environment Variables → CRON_SECRET)
 * Vercel Cron은 이 값을 Authorization: Bearer <CRON_SECRET> 헤더로 전송합니다.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[cron/blog-trigger] CRON_SECRET is not configured');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authorization = request.headers.get('authorization');
  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await getAutomationSettings();

    if (!settings.is_enabled) {
      console.info('[cron/blog-trigger] skipped: disabled');
      return NextResponse.json({
        skipped: true,
        reason: 'disabled',
      });
    }

    if (!matchesPublishSchedule(settings.publish_schedule)) {
      console.info(
        `[cron/blog-trigger] skipped: schedule_mismatch (${settings.publish_schedule}, kst=${getKstTimeLabel()})`,
      );
      return NextResponse.json({
        skipped: true,
        reason: 'schedule_mismatch',
        publish_schedule: settings.publish_schedule,
        kst_time: getKstTimeLabel(),
      });
    }

    if (!matchesPublishTime(settings.publish_time)) {
      return NextResponse.json({
        skipped: true,
        reason: 'publish_time_mismatch',
        publish_time: settings.publish_time,
        kst_time: getKstTimeLabel(),
      });
    }

    const webhookUrl = settings.webhook_url?.trim();
    if (!webhookUrl) {
      console.error('[cron/blog-trigger] webhook_url is empty');
      return NextResponse.json({
        skipped: true,
        reason: 'empty_webhook_url',
      });
    }

    console.info(
      `[cron/blog-trigger] firing webhook (kst=${getKstTimeLabel()}, publish_time=${settings.publish_time})`,
    );

    const payload = buildBlogWebhookPayload(settings);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text().catch(() => '');

    if (!response.ok) {
      console.error(
        `[cron/blog-trigger] webhook failed (${response.status}): ${responseText.slice(0, 500)}`,
      );
      return NextResponse.json({
        success: false,
        status: response.status,
        error: responseText.slice(0, 500) || 'Webhook request failed',
      });
    }

    return NextResponse.json({
      success: true,
      status: response.status,
      kst_time: getKstTimeLabel(),
      response: responseText.slice(0, 500) || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[cron/blog-trigger]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
