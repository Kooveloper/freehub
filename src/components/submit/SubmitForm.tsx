'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { SubmissionType, ToolOption } from '@/types/submission';

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

const EMAIL_MAX = 100;
const COOLDOWN_MS = 3000;

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const TABS: { id: SubmissionType; label: string }[] = [
  { id: 'new_tool', label: '새 툴 제보' },
  { id: 'limit_change', label: '한도 변경 신고' },
  { id: 'bug', label: '버그/오류 신고' },
];

interface SubmitFormProps {
  tools: ToolOption[];
}

/** 제보 탭 폼 */
export function SubmitForm({ tools }: SubmitFormProps) {
  const [activeTab, setActiveTab] = useState<SubmissionType>('new_tool');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [cooldown, setCooldown] = useState(false);

  // 탭1: 새 툴 제보
  const [toolName, setToolName] = useState('');
  const [toolUrl, setToolUrl] = useState('');
  const [freeLimit, setFreeLimit] = useState('');
  const [description, setDescription] = useState('');

  // 탭2: 한도 변경
  const [selectedToolId, setSelectedToolId] = useState('');
  const [changeContent, setChangeContent] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  // 탭3: 버그
  const [bugDescription, setBugDescription] = useState('');
  const [pageUrl, setPageUrl] = useState('');

  // 공통
  const [email, setEmail] = useState('');

  const resetStatus = () => {
    if (status === 'success' || status === 'error') setStatus('idle');
  };

  const startCooldown = () => {
    setCooldown(true);
    setTimeout(() => setCooldown(false), COOLDOWN_MS);
  };

  const selectedTool = tools.find((t) => t.id === selectedToolId);

  const isNewToolValid =
    toolName.trim().length > 0 &&
    toolUrl.trim().length > 0 &&
    freeLimit.trim().length > 0 &&
    description.trim().length > 0;

  const isLimitChangeValid =
    selectedToolId.length > 0 &&
    changeContent.trim().length > 0 &&
    evidenceUrl.trim().length > 0;

  const isBugValid = bugDescription.trim().length > 0;

  const isValid =
    (activeTab === 'new_tool' && isNewToolValid) ||
    (activeTab === 'limit_change' && isLimitChangeValid) ||
    (activeTab === 'bug' && isBugValid);

  const isDisabled = status === 'submitting' || cooldown || !isValid;

  const buildPayload = () => {
    switch (activeTab) {
      case 'new_tool':
        return {
          toolName: toolName.trim(),
          url: toolUrl.trim(),
          freeLimit: freeLimit.trim(),
          description: description.trim(),
        };
      case 'limit_change':
        return {
          toolId: selectedToolId,
          toolName: selectedTool?.name ?? '',
          changeContent: changeContent.trim(),
          evidenceUrl: evidenceUrl.trim(),
        };
      case 'bug':
        return {
          description: bugDescription.trim(),
          ...(pageUrl.trim() ? { pageUrl: pageUrl.trim() } : {}),
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
    setEvidenceUrl('');
    setBugDescription('');
    setPageUrl('');
    setEmail('');
  };

  const handleTabChange = (tab: SubmissionType) => {
    setActiveTab(tab);
    resetStatus();
  };

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
          email: email.trim() || undefined,
          payload: buildPayload(),
        }),
      });

      if (!res.ok) throw new Error('제보 실패');

      setStatus('success');
      clearForm();
      startCooldown();
    } catch {
      setStatus('error');
      startCooldown();
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* 탭 */}
      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
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
                className={INPUT_CLASS}
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
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="무료 한도" required>
              <input
                type="text"
                value={freeLimit}
                onChange={(e) => {
                  resetStatus();
                  setFreeLimit(e.target.value);
                }}
                placeholder="예: 매일 20회, 월 10,000토큰"
                maxLength={200}
                required
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="설명" required>
              <textarea
                value={description}
                onChange={(e) => {
                  resetStatus();
                  setDescription(e.target.value);
                }}
                placeholder="무료 플랜의 주요 기능과 특징을 알려주세요"
                maxLength={1000}
                required
                rows={4}
                className={cn(INPUT_CLASS, 'resize-none')}
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
                className={INPUT_CLASS}
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
                className={cn(INPUT_CLASS, 'resize-none')}
              />
            </Field>
            <Field label="증거 URL" required>
              <input
                type="url"
                value={evidenceUrl}
                onChange={(e) => {
                  resetStatus();
                  setEvidenceUrl(e.target.value);
                }}
                placeholder="공식 페이지, 스크린샷 링크 등"
                required
                className={INPUT_CLASS}
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
                className={cn(INPUT_CLASS, 'resize-none')}
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
                className={INPUT_CLASS}
              />
            </Field>
          </>
        )}

        <Field label="이메일">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              resetStatus();
              setEmail(e.target.value.slice(0, EMAIL_MAX));
            }}
            placeholder="답변 받을 이메일 (선택사항)"
            maxLength={EMAIL_MAX}
            className={INPUT_CLASS}
          />
        </Field>

        <button
          type="submit"
          disabled={isDisabled}
          className={cn(
            'w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors',
            isDisabled
              ? 'cursor-not-allowed bg-blue-300'
              : 'bg-blue-600 hover:bg-blue-700',
          )}
        >
          {status === 'submitting' ? '제출 중...' : '제보하기'}
        </button>

        {status === 'success' && (
          <p className="text-center text-sm font-medium text-green-600">
            제보가 접수되었습니다! 검토 후 반영할게요 😊
          </p>
        )}

        {status === 'error' && (
          <p className="text-center text-sm font-medium text-red-600">
            잠시 후 다시 시도해주세요
          </p>
        )}
      </form>
    </div>
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
