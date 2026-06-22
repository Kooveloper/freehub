export interface SignupConsentState {
  terms: boolean;
  privacy: boolean;
  marketing: boolean;
}

export const EMPTY_SIGNUP_CONSENT: SignupConsentState = {
  terms: false,
  privacy: false,
  marketing: false,
};

const SESSION_KEY = 'fh_signup_consent';

export function isRequiredConsentComplete(consent: SignupConsentState): boolean {
  return consent.terms && consent.privacy;
}

export function buildConsentTimestamps(consent: SignupConsentState) {
  const now = new Date().toISOString();
  return {
    terms_agreed_at: consent.terms ? now : null,
    privacy_agreed_at: consent.privacy ? now : null,
    marketing_opt_in: consent.marketing,
    marketing_opt_in_at: consent.marketing ? now : null,
  };
}

export function buildConsentUserMetadata(consent: SignupConsentState) {
  const timestamps = buildConsentTimestamps(consent);
  return {
    terms_agreed_at: timestamps.terms_agreed_at,
    privacy_agreed_at: timestamps.privacy_agreed_at,
    marketing_opt_in: timestamps.marketing_opt_in,
    marketing_opt_in_at: timestamps.marketing_opt_in_at,
  };
}

export function saveSignupConsentSession(consent: SignupConsentState): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(consent));
}

export function readSignupConsentSession(): SignupConsentState | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<SignupConsentState>;
    return {
      terms: Boolean(parsed.terms),
      privacy: Boolean(parsed.privacy),
      marketing: Boolean(parsed.marketing),
    };
  } catch {
    return null;
  }
}

export function clearSignupConsentSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function consentFromUserMetadata(
  metadata: Record<string, unknown> | undefined,
): SignupConsentState | null {
  if (!metadata) return null;

  const terms = Boolean(metadata.terms_agreed_at);
  const privacy = Boolean(metadata.privacy_agreed_at);
  const marketing = Boolean(metadata.marketing_opt_in);

  if (!terms && !privacy && !marketing) return null;
  return { terms, privacy, marketing };
}
