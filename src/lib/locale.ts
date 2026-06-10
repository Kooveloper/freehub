import { cookies } from 'next/headers';

import { createTranslator } from '@/i18n';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  resolveLocale,
  type Locale,
} from '@/i18n/config';

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);
}

export async function getTranslations() {
  const locale = await getLocale();
  return createTranslator(locale);
}

export { DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale, type Locale };
