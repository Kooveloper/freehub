'use client';

import { useEffect } from 'react';

import {
  buildConsentTimestamps,
  clearSignupConsentSession,
  isRequiredConsentComplete,
  readSignupConsentSession,
} from '@/lib/signup-consent';
import { createClient } from '@/lib/supabase/client';

/** Google 가입 등 OAuth 직후 sessionStorage에 저장된 동의를 프로필에 반영 */
export function PersistSignupConsent() {
  useEffect(() => {
    const consent = readSignupConsentSession();
    if (!consent || !isRequiredConsentComplete(consent)) return;

    let cancelled = false;

    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      const response = await fetch('/api/profile/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildConsentTimestamps(consent)),
      });

      if (response.ok) {
        clearSignupConsentSession();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
