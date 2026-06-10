import type { Locale } from '@/i18n/config';

import { en } from './messages/en';
import { ko, type Messages } from './messages/ko';

const messages: Record<Locale, Messages> = { ko, en };

type NestedKeyOf<T, Prefix extends string = ''> = T extends string
  ? Prefix extends ''
    ? never
    : Prefix
  : {
      [K in keyof T & string]: NestedKeyOf<
        T[K],
        Prefix extends '' ? K : `${Prefix}.${K}`
      >;
    }[keyof T & string];

export type MessageKey = NestedKeyOf<Messages>;

function getNestedValue(obj: unknown, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === 'string' ? current : undefined;
}

function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] != null ? String(params[key]) : `{${key}}`,
  );
}

export function createTranslator(locale: Locale) {
  const catalog = messages[locale];

  return function t(
    key: MessageKey,
    params?: Record<string, string | number>,
  ): string {
    const value = getNestedValue(catalog, key);
    if (!value) return key;
    return interpolate(value, params);
  };
}

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}

export { ko, en, messages };
