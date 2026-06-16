'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';
import {
  UI_INPUT_CLASS,
  UI_TEXTAREA_CLASS,
  uiButtonPrimaryClass,
} from '@/lib/ui/form';
import type { SubmissionType, ToolOption } from '@/types/submission';

const EMAIL_MAX = 100;
const COOLDOWN_MS = 3000;

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const TABS: { id: SubmissionType; label: string }[] = [
  { id: 'new_tool', label: '새 툴 제보' },
  { id: 'limit_change', label: '한도 변경' },
  { id: 'bug', label: '버그/오류' },
  { id: 'inquiry', label: '기타 문의' },
];

const TAB_SET = new Set<SubmissionType>(TABS.map((tab) => tab.id));

function resolveInitialTab(value: string | null): SubmissionType {
  if (value && TAB_SET.has(value as SubmissionType)) {
    return value as SubmissionType;
  }
  return 'new_tool';
}

interface SubmitFormProps {
  tools: ToolOption[];
}

/** 제보 탭 폼 */
export function SubmitForm({ tools }: SubmitFormProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SubmissionType>(() =>
    resolveInitialTab(searchParams.get('tab')),
  );
  const [status, setStatus] = useState<FormStatus>('idle');
  const [cooldown, setCooldown] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // 탭1: 새 툴 제보
  const [toolName, setToolName] = useState('');
  const [toolUrl, setToolUrl] = useState('');
  const [freeLimit, setFreeLimit] = useState('');
  const [description, setDescription] = useState('');

  // 탭2: 한도 변경
  const [selectedToolId, setSelectedToolId] = useState('');
  const [changeContent, setChangeContent] = useState('');

  // 탭3: 버그
  const [bugDescription, setBugDescription] = useState('');
  const [pageUrl, setPageUrl] = useState('');

  // 탭4: 기타 문의
  const [inquiryTitle, setInquiryTitle] = useState('');
  const [inquiryContent, setInquiryContent] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');

  useEffect(() => {
    const tab = resolveInitialTab(searchParams.get('tab'));
    setActiveTab(tab);
  }, [searchParams]);

  const resetStatus = () => {
    if (status === 'success' || status === 'error') setStatus('idle');
  };

  const startCooldown = () => {
    setCooldown(true);
    setTimeout(() => setCooldown(false), COOLDOWN_MS);
  };

  const selectedTool = tools.find((t) => t.id === selectedToolId);

  const isNewToolValid =
    toolName.trim().length > 0 && toolUrl.trim().length > 0;

  const isLimitChangeValid =
    selectedToolId.length > 0 && changeContent.trim().length > 0;

  const isBugValid = bugDescription.trim().length > 0;

  const isInquiryValid =
    inquiryTitle.trim().length > 0 &&
    inquiryContent.trim().length > 0 &&
    inquiryEmail.trim().length > 0;

  const isValid =
    (activeTab === 'new_tool' && isNewToolValid) ||
    (activeTab === 'limit_change' && isLimitChangeValid) ||
    (activeTab === 'bug' && isBugValid) ||
    (activeTab === 'inquiry' && isInquiryValid);

  const isDisabled = status === 'submitting' || cooldown || !isValid;

  const buildPayload = () => {
    switch (activeTab) {
      case 'new_tool':
        return {
          toolName: toolName.trim(),
          url: toolUrl.trim(),
          ...(freeLimit.trim() ? { freeLimit: freeLimit.trim() } : {}),
          ...(description.trim() ? { description: description.trim() } : {}),
        };
      case 'limit_change':
        return {
          toolId: selectedToolId,
          toolName: selectedTool?.name ?? '',
          changeContent: changeContent.trim(),
        };
      case 'bug':
        return {
          description: bugDescription.trim(),
          ...(pageUrl.trim() ? { pageUrl: pageUrl.trim() } : {}),
        };
      case 'inquiry':
        return {
          title: inquiryTitle.trim(),
          content: inquiryContent.trim(),
        };
    }
  };

  const clearForm = () => {
    setToolName('');
    setToolUrl('');
    setFreeLimit('');
    setDescription('');
    setSelectedToolId('');
    setChangeContent('');
    setBugDescription('');
    setPageUrl('');
    setInquiryTitle('');
    setInquiryContent('');
    setInquiryEmail('');
  };

  const handleTabChange = (tab: SubmissionType) => {
    setActiveTab(tab);
    resetStatus();
    setShowSuccessToast(false);
  };

  useEffect(() => {
    if (!showSuccessToast) return;
    const timer = window.setTimeout(() => setShowSuccessToast(false), 4000);
    return () => window.clearTimeout(timer);
  }, [showSuccessToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;

    setStatus('submitting');

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          ...(activeTab === 'inquiry'
            ? { email: inquiryEmail.trim() }
            : {}),
          payload: buildPayload(),
        }),
      });

      if (!res.ok) throw new Error('제보 실패');

      setStatus('success');
      setShowSuccessToast(true);
      clearForm();
      startCooldown();
    } catch {
      setStatus('error');
      startCooldown();
    }
  };

  const successMessage =
    activeTab === 'inquiry' ? '문의가 접수되었습니다' : '제보가 접수되었습니다';

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex overflow-x-auto border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'min-w-[5.5rem] flex-1 whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 sm:p-8">
          {activeTab === 'new_tool' && (
            <>
              <Field label="툴 이름" required>
                <input
                  type="text"
                  value={toolName}
                  onChange={(e) => {
                    resetStatus();
                    setToolName(e.target.value);
                  }}
                  placeholder="예: ChatGPT"
                  maxLength={100}
                  required
                  className={UI_INPUT_CLASS}
                />
              </Field>
              <Field label="URL" required>
                <input
                  type="url"
                  value={toolUrl}
                  onChange={(e) => {
                    resetStatus();
                    setToolUrl(e.target.value);
                  }}
                  placeholder="https://..."
                  required
                  className={UI_INPUT_CLASS}
                />
              </Field>
              <Field label="무료 한도">
                <input
                  type="text"
                  value={freeLimit}
                  onChange={(e) => {
                    resetStatus();
                    setFreeLimit(e.target.value);
                  }}
                  placeholder="예: 매일 20회, 월 10,000토큰"
                  maxLength={200}
                  className={UI_INPUT_CLASS}
                />
              </Field>
              <Field label="설명">
                <textarea
                  value={description}
                  onChange={(e) => {
                    resetStatus();
                    setDescription(e.target.value);
                  }}
                  placeholder="무료 플랜의 주요 기능과 특징을 알려주세요"
                  maxLength={1000}
                  rows={4}
                  className={cn(UI_TEXTAREA_CLASS, 'resize-none')}
                />
              </Field>
            </>
          )}

          {activeTab === 'limit_change' && (
            <>
              <Field label="툴 선택" required>
                <select
                  value={selectedToolId}
                  onChange={(e) => {
                    resetStatus();
                    setSelectedToolId(e.target.value);
                  }}
                  required
                  className={UI_INPUT_CLASS}
                >
                  <option value="">툴을 선택해주세요</option>
                  {tools.map((tool) => (
                    <option key={tool.id} value={tool.id}>
                      {tool.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="변경 내용" required>
                <textarea
                  value={changeContent}
                  onChange={(e) => {
                    resetStatus();
                    setChangeContent(e.target.value);
                  }}
                  placeholder="어떤 한도가 어떻게 변경되었는지 알려주세요"
                  maxLength={1000}
                  required
                  rows={4}
                  className={cn(UI_TEXTAREA_CLASS, 'resize-none')}
                />
              </Field>
            </>
          )}

          {activeTab === 'bug' && (
            <>
              <Field label="오류 내용" required>
                <textarea
                  value={bugDescription}
                  onChange={(e) => {
                    resetStatus();
                    setBugDescription(e.target.value);
                  }}
                  placeholder="어떤 오류가 발생했는지 자세히 알려주세요"
                  maxLength={1000}
                  required
                  rows={4}
                  className={cn(UI_TEXTAREA_CLASS, 'resize-none')}
                />
              </Field>
              <Field label="발생 페이지 URL">
                <input
                  type="url"
                  value={pageUrl}
                  onChange={(e) => {
                    resetStatus();
                    setPageUrl(e.target.value);
                  }}
                  placeholder="https://freehub.kr/tool/... (선택)"
                  className={UI_INPUT_CLASS}
                />
              </Field>
            </>
          )}

          {activeTab === 'inquiry' && (
            <>
              <Field label="제목" required>
                <input
                  type="text"
                  value={inquiryTitle}
                  onChange={(e) => {
                    resetStatus();
                    setInquiryTitle(e.target.value);
                  }}
                  placeholder="문의 제목을 입력해주세요"
                  maxLength={120}
                  required
                  className={UI_INPUT_CLASS}
                />
              </Field>
              <Field label="내용" required>
                <textarea
                  value={inquiryContent}
                  onChange={(e) => {
                    resetStatus();
                    setInquiryContent(e.target.value);
                  }}
                  placeholder="문의 내용을 자세히 입력해주세요"
                  maxLength={2000}
                  required
                  rows={5}
                  className={cn(UI_TEXTAREA_CLASS, 'resize-none')}
                />
              </Field>
              <Field label="답변 받을 이메일" required>
                <input
                  type="email"
                  value={inquiryEmail}
                  onChange={(e) => {
                    resetStatus();
                    setInquiryEmail(e.target.value.slice(0, EMAIL_MAX));
                  }}
                  placeholder="you@example.com"
                  maxLength={EMAIL_MAX}
                  required
                  className={UI_INPUT_CLASS}
                />
              </Field>
            </>
          )}

          <button
            type="submit"
            disabled={isDisabled}
            className={uiButtonPrimaryClass(isDisabled)}
          >
            {status === 'submitting'
              ? '제출 중...'
              : activeTab === 'inquiry'
                ? '문의하기'
                : '제보하기'}
          </button>

          {status === 'error' && (
            <p className="text-center text-sm font-medium text-red-600">
              잠시 후 다시 시도해주세요
            </p>
          )}
        </form>
      </div>

      {showSuccessToast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,24rem)] -translate-x-1/2 rounded-xl border border-green-200 bg-white px-4 py-3 shadow-lg"
        >
          <p className="text-sm font-semibold text-gray-900">{successMessage}</p>
          <p className="mt-1 text-xs text-gray-500">
            검토 후 답변드릴게요. 감사합니다!
          </p>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}
