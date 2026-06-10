'use client';

import { Star, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** 비로그인 사용자에게 로그인을 유도하는 모달 */
export function LoginPromptModal({ isOpen, onClose }: LoginPromptModalProps) {
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
          aria-label="닫기"
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
            즐겨찾기 기능을 사용해보세요
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            로그인하면 자주 쓰는 툴을 즐겨찾기하고 목록 맨 위에서 바로 찾을 수
            있어요.
          </p>

          <div className="mt-6 flex w-full flex-col gap-3">
            <Link
              href="/login"
              onClick={onClose}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              로그인하기
            </Link>
            <Link
              href="/signup"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
