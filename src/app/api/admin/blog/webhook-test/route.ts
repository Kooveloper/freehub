import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { normalizeMainKeywords } from '@/lib/blog/keyword-items';
import { getAutomationSettings } from '@/lib/supabase/blog-queries';

export async function POST() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const settings = await getAutomationSettings();
    const webhookUrl = settings.webhook_url?.trim();

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL을 입력해주세요.' },
        { status: 400 },
      );
    }

    const mainKeywords = normalizeMainKeywords(settings.main_keywords);
    const payload = {
      main_keywords: mainKeywords,
      target_categories: settings.target_categories ?? [],
      cta_links: settings.cta_links ?? [],
      tone: settings.tone,
      post_length: settings.post_length,
      auto_publish: settings.auto_publish,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return NextResponse.json(
        { error: `Webhook 전송 실패 (${response.status}): ${text.slice(0, 200)}` },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : '전송 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
