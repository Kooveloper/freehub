export function validateUserUpdate(
  body: unknown,
): { action: 'verify' } | { password: string } | null {
  if (!body || typeof body !== 'object') return null;

  const record = body as Record<string, unknown>;

  if (record.action === 'verify') {
    return { action: 'verify' };
  }

  if (typeof record.password === 'string') {
    const password = record.password.trim();
    if (password.length < 6) return null;
    return { password };
  }

  return null;
}
