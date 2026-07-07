import {
  getInspectionAccessToken,
  getSearchConsoleSiteUrl,
} from '@/lib/google/gsc-auth';

export interface UrlInspectionResult {
  isIndexed: boolean;
  verdict: string | null;
  coverageState: string | null;
  indexingState: string | null;
  lastCrawlTime: string | null;
}

interface InspectionApiResponse {
  inspectionResult?: {
    indexStatusResult?: {
      verdict?: string;
      coverageState?: string;
      indexingState?: string;
      lastCrawlTime?: string;
    };
  };
  error?: { message?: string };
}

function deriveIsIndexed(
  verdict: string | null,
  coverageState: string | null,
): boolean {
  if (verdict !== 'PASS') return false;
  if (!coverageState) return false;
  return /indexed/i.test(coverageState);
}

export async function inspectUrl(
  inspectionUrl: string,
): Promise<
  { ok: true; result: UrlInspectionResult } | { ok: false; error: string }
> {
  const siteUrl = getSearchConsoleSiteUrl();
  const token = await getInspectionAccessToken();

  if (!siteUrl || !token) {
    return { ok: false, error: 'Google Search Console not configured' };
  }

  const response = await fetch(
    'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inspectionUrl, siteUrl }),
    },
  );

  const data = (await response.json().catch(() => ({}))) as InspectionApiResponse;

  if (!response.ok) {
    const message =
      data.error?.message ?? `URL Inspection API ${response.status}`;
    return { ok: false, error: message };
  }

  const indexStatus = data.inspectionResult?.indexStatusResult;
  const verdict = indexStatus?.verdict ?? null;
  const coverageState = indexStatus?.coverageState ?? null;

  return {
    ok: true,
    result: {
      isIndexed: deriveIsIndexed(verdict, coverageState),
      verdict,
      coverageState,
      indexingState: indexStatus?.indexingState ?? null,
      lastCrawlTime: indexStatus?.lastCrawlTime ?? null,
    },
  };
}
