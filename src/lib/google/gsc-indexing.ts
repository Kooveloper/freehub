import { getIndexingAccessToken } from '@/lib/google/gsc-auth';

export type IndexingNotificationType = 'URL_UPDATED' | 'URL_DELETED';

export async function submitUrlForIndexing(
  url: string,
  type: IndexingNotificationType = 'URL_UPDATED',
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = await getIndexingAccessToken();
  if (!token) {
    return { ok: false, error: 'Google service account not configured' };
  }

  const response = await fetch(
    'https://indexing.googleapis.com/v3/urlNotifications:publish',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, type }),
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return {
      ok: false,
      error: `Indexing API ${response.status}: ${text.slice(0, 300)}`,
    };
  }

  return { ok: true };
}
