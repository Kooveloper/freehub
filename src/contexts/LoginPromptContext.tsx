'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface LoginPromptContextValue {
  isOpen: boolean;
  showLoginPrompt: () => void;
  hideLoginPrompt: () => void;
}

const LoginPromptContext = createContext<LoginPromptContextValue | null>(null);

/** 로그인 유도 모달 상태 관리 */
export function LoginPromptProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const showLoginPrompt = useCallback(() => setIsOpen(true), []);
  const hideLoginPrompt = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, showLoginPrompt, hideLoginPrompt }),
    [isOpen, showLoginPrompt, hideLoginPrompt],
  );

  return (
    <LoginPromptContext.Provider value={value}>
      {children}
    </LoginPromptContext.Provider>
  );
}

export function useLoginPrompt() {
  const context = useContext(LoginPromptContext);
  if (!context) {
    throw new Error('useLoginPrompt는 LoginPromptProvider 내부에서 사용해야 합니다.');
  }
  return context;
}
