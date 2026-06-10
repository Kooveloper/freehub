'use client';

import { useLoginPrompt } from '@/contexts/LoginPromptContext';

import { LoginPromptModal } from './LoginPromptModal';

/** layout.tsx에서 useLoginPrompt로 모달 상태를 연결하는 호스트 */
export function LoginPromptModalHost() {
  const { isOpen, hideLoginPrompt } = useLoginPrompt();

  return <LoginPromptModal isOpen={isOpen} onClose={hideLoginPrompt} />;
}
