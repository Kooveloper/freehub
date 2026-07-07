import { GoogleAuth } from 'google-auth-library';

const INDEXING_SCOPE = 'https://www.googleapis.com/auth/indexing';
const WEBMASTERS_SCOPE = 'https://www.googleapis.com/auth/webmasters';

function parseServiceAccountJson(): Record<string, unknown> | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    console.error('[gsc] GOOGLE_SERVICE_ACCOUNT_JSON is invalid JSON');
    return null;
  }
}

export function isGoogleSearchConsoleConfigured(): boolean {
  return Boolean(parseServiceAccountJson() && getSearchConsoleSiteUrl());
}

export function getSearchConsoleSiteUrl(): string | null {
  const explicit = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim();
  if (explicit) return explicit;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  return appUrl ? `${appUrl}/` : null;
}

export async function getGoogleAccessToken(scope: string): Promise<string | null> {
  const credentials = parseServiceAccountJson();
  if (!credentials) return null;

  const auth = new GoogleAuth({
    credentials,
    scopes: [scope],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token =
    typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;

  return token ?? null;
}

export async function getIndexingAccessToken(): Promise<string | null> {
  return getGoogleAccessToken(INDEXING_SCOPE);
}

export async function getInspectionAccessToken(): Promise<string | null> {
  return getGoogleAccessToken(WEBMASTERS_SCOPE);
}

export function buildBlogPostUrl(slug: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://freehub.kr';
  return `${base}/blog/${slug}`;
}
