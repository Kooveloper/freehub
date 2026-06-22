'use client';

import { Star, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { UI_BUTTON_OUTLINE_CLASS, uiButtonPrimaryClass } from '@/lib/ui/form';
import {
  TRACK_LOGIN_MODAL,
  TRACK_SIGNUP_MODAL,
} from '@/constants/tracking-classes';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** 비로그인 사용자에게 로그인을 유도하는 모달 */
export function LoginPromptModal({ isOpen, onClose }: LoginPromptModalProps) {
  const { t } = useLocale();
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-prompt-title"
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label={t('loginPrompt.close')}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
            <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
          </div>

          <h2
            id="login-prompt-title"
            className="text-lg font-bold text-gray-900"
          >
            {t('loginPrompt.title')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            {t('loginPrompt.description')}
          </p>

          <div className="mt-6 flex w-full flex-col gap-3">
            <Link
              href="/login"
              onClick={onClose}
              className={cn(uiButtonPrimaryClass(false), TRACK_LOGIN_MODAL)}
            >
              {t('loginPrompt.loginButton')}
            </Link>
            <Link
              href="/signup"
              onClick={onClose}
              className={cn(UI_BUTTON_OUTLINE_CLASS, TRACK_SIGNUP_MODAL)}
            >
              {t('loginPrompt.signupButton')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
