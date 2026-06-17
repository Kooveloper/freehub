'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import {
  UI_INPUT_CLASS,
  UI_TEXTAREA_CLASS,
  uiButtonPrimaryClass,
} from '@/lib/ui/form';
import type { SubmissionType, ToolOption } from '@/types/submission';

const COOLDOWN_MS = 3000;

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

type SubmitTab = Exclude<SubmissionType, 'inquiry'>;

const TAB_IDS: SubmitTab[] = ['new_tool', 'limit_change', 'bug'];
const TAB_SET = new Set<SubmitTab>(TAB_IDS);

function resolveInitialTab(value: string | null): SubmitTab {
  if (value && TAB_SET.has(value as SubmitTab)) {
    return value as SubmitTab;
  }
  return 'new_tool';
}

interface SubmitFormProps {
  tools: ToolOption[];
}

/** 제보 탭 폼 */
export function SubmitForm({ tools }: SubmitFormProps) {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SubmitTab>(() =>
    resolveInitialTab(searchParams.get('tab')),
  );
  const [status, setStatus] = useState<FormStatus>('idle');
  const [cooldown, setCooldown] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [toolName, setToolName] = useState('');
  const [toolUrl, setToolUrl] = useState('');
  const [freeLimit, setFreeLimit] = useState('');
  const [description, setDescription] = useState('');

  const [selectedToolId, setSelectedToolId] = useState('');
  const [changeContent, setChangeContent] = useState('');

  const [bugDescription, setBugDescription] = useState('');
  const [pageUrl, setPageUrl] = useState('');

  const tabs = useMemo(
    () =>
      [
        { id: 'new_tool' as const, label: t('submit.tabNewTool') },
        { id: 'limit_change' as const, label: t('submit.tabLimitChange') },
        { id: 'bug' as const, label: t('submit.tabBug') },
      ] satisfies { id: SubmitTab; label: string }[],
    [t],
  );

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

  const selectedTool = tools.find((item) => item.id === selectedToolId);

  const isNewToolValid =
    toolName.trim().length > 0 && toolUrl.trim().length > 0;

  const isLimitChangeValid =
    selectedToolId.length > 0 && changeContent.trim().length > 0;

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
  };

  const handleTabChange = (tab: SubmitTab) => {
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
          payload: buildPayload(),
        }),
      });

      if (!res.ok) throw new Error('submit failed');

      setStatus('success');
      setShowSuccessToast(true);
      clearForm();
      startCooldown();
    } catch {
      setStatus('error');
      startCooldown();
    }
  };

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex overflow-x-auto border-b border-gray-200">
          {tabs.map((tab) => (
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
              <Field label={t('submit.toolName')} required>
                <input
                  type="text"
                  value={toolName}
                  onChange={(e) => {
                    resetStatus();
                    setToolName(e.target.value);
                  }}
                  placeholder={t('submit.toolNamePlaceholder')}
                  maxLength={100}
                  required
                  className={UI_INPUT_CLASS}
                />
              </Field>
              <Field label={t('submit.url')} required>
                <input
                  type="url"
                  value={toolUrl}
                  onChange={(e) => {
                    resetStatus();
                    setToolUrl(e.target.value);
                  }}
                  placeholder={t('submit.urlPlaceholder')}
                  required
                  className={UI_INPUT_CLASS}
                />
              </Field>
              <Field label={t('submit.freeLimit')}>
                <input
                  type="text"
                  value={freeLimit}
                  onChange={(e) => {
                    resetStatus();
                    setFreeLimit(e.target.value);
                  }}
                  placeholder={t('submit.freeLimitPlaceholder')}
                  maxLength={200}
                  className={UI_INPUT_CLASS}
                />
              </Field>
              <Field label={t('submit.description')}>
                <textarea
                  value={description}
                  onChange={(e) => {
                    resetStatus();
                    setDescription(e.target.value);
                  }}
                  placeholder={t('submit.descriptionPlaceholder')}
                  maxLength={1000}
                  rows={4}
                  className={cn(UI_TEXTAREA_CLASS, 'resize-none')}
                />
              </Field>
            </>
          )}

          {activeTab === 'limit_change' && (
            <>
              <Field label={t('submit.selectTool')} required>
                <select
                  value={selectedToolId}
                  onChange={(e) => {
                    resetStatus();
                    setSelectedToolId(e.target.value);
                  }}
                  required
                  className={UI_INPUT_CLASS}
                >
                  <option value="">{t('submit.selectToolPlaceholder')}</option>
                  {tools.map((tool) => (
                    <option key={tool.id} value={tool.id}>
                      {tool.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('submit.changeContent')} required>
                <textarea
                  value={changeContent}
                  onChange={(e) => {
                    resetStatus();
                    setChangeContent(e.target.value);
                  }}
                  placeholder={t('submit.changeContentPlaceholder')}
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
              <Field label={t('submit.bugContent')} required>
                <textarea
                  value={bugDescription}
                  onChange={(e) => {
                    resetStatus();
                    setBugDescription(e.target.value);
                  }}
                  placeholder={t('submit.bugContentPlaceholder')}
                  maxLength={1000}
                  required
                  rows={4}
                  className={cn(UI_TEXTAREA_CLASS, 'resize-none')}
                />
              </Field>
              <Field label={t('submit.pageUrl')}>
                <input
                  type="url"
                  value={pageUrl}
                  onChange={(e) => {
                    resetStatus();
                    setPageUrl(e.target.value);
                  }}
                  placeholder={t('submit.pageUrlPlaceholder')}
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
              ? t('submit.submitting')
              : t('submit.submitButton')}
          </button>

          {status === 'error' && (
            <p className="text-center text-sm font-medium text-red-600">
              {t('submit.error')}
            </p>
          )}
        </form>
      </div>

      {showSuccessToast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,24rem)] -translate-x-1/2 rounded-xl border border-green-200 bg-white px-4 py-3 shadow-lg"
        >
          <p className="text-sm font-semibold text-gray-900">
            {t('submit.successTitle')}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {t('submit.successDescription')}
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
