import { cn } from '@/lib/utils';

/** 공통 폼 인풋 (높이 60px) */
export const UI_INPUT_CLASS =
  'w-full h-[60px] rounded-xl border border-gray-300 px-4 text-base text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

/** 공통 textarea (최소 높이 60px) */
export const UI_TEXTAREA_CLASS =
  'w-full min-h-[60px] rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

/** 공통 primary 버튼 */
export function uiButtonPrimaryClass(disabled?: boolean) {
  return cn(
    'inline-flex h-[60px] w-full items-center justify-center rounded-xl px-4 text-base font-semibold text-white transition-colors',
    disabled
      ? 'cursor-not-allowed bg-blue-300'
      : 'bg-brand-600 hover:bg-brand-700',
  );
}

/** 공통 outline 버튼 */
export const UI_BUTTON_OUTLINE_CLASS =
  'inline-flex h-[60px] w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50';
