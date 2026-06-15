'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { CategoryAssignmentsEditor } from '@/components/admin/CategoryAssignmentsEditor';
import { Toast, useToast } from '@/components/admin/Toast';
import {
  FREE_LIMIT_TYPE_LABELS,
  generateSlugFromName,
  SLUG_PATTERN,
  type ToolFormInput,
  toolToFormInput,
} from '@/lib/admin/tools';
import { cn } from '@/lib/utils';
import type { Category, FreeLimitType, SubCategory, Tool } from '@/types/tool';

interface ToolFormProps {
  categories: Category[];
  subCategories: SubCategory[];
  initialTool?: Tool;
  viewCount30d?: number;
}

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-gray-700';

const SUB_LABEL_CLASS = 'mb-1 block text-xs text-gray-500';

function BilingualField({
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
      <span className={LABEL_CLASS}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function BilingualInput({
  idKo,
  idEn,
  labelKo = '한국어',
  labelEn = 'English',
  valueKo,
  valueEn,
  onChangeKo,
  onChangeEn,
  placeholderKo,
  placeholderEn,
  requiredKo,
  type = 'text',
  rows,
}: {
  idKo: string;
  idEn: string;
  labelKo?: string;
  labelEn?: string;
  valueKo: string;
  valueEn: string;
  onChangeKo: (value: string) => void;
  onChangeEn: (value: string) => void;
  placeholderKo?: string;
  placeholderEn?: string;
  requiredKo?: boolean;
  type?: 'text' | 'url';
  rows?: number;
}) {
  if (rows) {
    return (
      <>
        <div>
          <label htmlFor={idKo} className={SUB_LABEL_CLASS}>
            {labelKo}
            {requiredKo && ' *'}
          </label>
          <textarea
            id={idKo}
            rows={rows}
            value={valueKo}
            onChange={(event) => onChangeKo(event.target.value)}
            placeholder={placeholderKo}
            required={requiredKo}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor={idEn} className={SUB_LABEL_CLASS}>
            {labelEn}
          </label>
          <textarea
            id={idEn}
            rows={rows}
            value={valueEn}
            onChange={(event) => onChangeEn(event.target.value)}
            placeholder={placeholderEn}
            className={INPUT_CLASS}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div>
        <label htmlFor={idKo} className={SUB_LABEL_CLASS}>
          {labelKo}
          {requiredKo && ' *'}
        </label>
        <input
          id={idKo}
          type={type}
          value={valueKo}
          onChange={(event) => onChangeKo(event.target.value)}
          placeholder={placeholderKo}
          required={requiredKo}
          className={INPUT_CLASS}
        />
      </div>
      <div>
        <label htmlFor={idEn} className={SUB_LABEL_CLASS}>
          {labelEn}
        </label>
        <input
          id={idEn}
          type={type}
          value={valueEn}
          onChange={(event) => onChangeEn(event.target.value)}
          placeholder={placeholderEn}
          className={INPUT_CLASS}
        />
      </div>
    </>
  );
}

function emptyForm(defaultCategorySlug: string): ToolFormInput {
  return {
    slug: '',
    name: '',
    name_en: '',
    category_slug: defaultCategorySlug,
    sub_category: null,
    category_assignments: [
      { category_slug: defaultCategorySlug, sub_category: null },
    ],
    logo_url: '',
    homepage_url: '',
    description: '',
    description_en: '',
    free_plan_exists: true,
    free_limit_type: 'daily',
    free_limit_amount: null,
    free_limit_unit: '',
    free_limit_unit_en: '',
    free_description: '',
    free_description_en: '',
    free_plan_url: '',
    requires_credit_card: false,
    free_features: [],
    free_features_en: [],
    paid_only_features: [],
    paid_only_features_en: [],
    signup_methods: [],
    tags: [],
    tags_en: [],
    tip: '',
    tip_en: '',
    is_sponsored: false,
    is_verified: false,
  };
}

async function parseApiError(response: Response) {
  const data = await response.json().catch(() => ({}));
  throw new Error(
    typeof data.error === 'string' ? data.error : '저장에 실패했습니다.',
  );
}

interface TagInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

function TagInput({ label, values, onChange, placeholder }: TagInputProps) {
  const [input, setInput] = useState('');

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag || values.includes(tag)) return;
    onChange([...values, tag]);
    setInput('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag(input);
    }
  };

  return (
    <div>
      <label className={SUB_LABEL_CLASS}>{label}</label>
      <div className="rounded-lg border border-gray-300 px-3 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
        {values.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {values.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onChange(values.filter((value) => value !== tag))}
                  className="rounded-full p-0.5 hover:bg-gray-200"
                  aria-label={`${tag} 제거`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? '입력 후 Enter'}
          className="w-full border-0 p-0 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
        />
      </div>
    </div>
  );
}

function BilingualTagInput({
  label,
  valuesKo,
  valuesEn,
  onChangeKo,
  onChangeEn,
  placeholderKo,
  placeholderEn,
}: {
  label: string;
  valuesKo: string[];
  valuesEn: string[];
  onChangeKo: (values: string[]) => void;
  onChangeEn: (values: string[]) => void;
  placeholderKo?: string;
  placeholderEn?: string;
}) {
  return (
    <div>
      <span className={LABEL_CLASS}>{label}</span>
      <div className="grid gap-3 sm:grid-cols-2">
        <TagInput
          label="한국어"
          values={valuesKo}
          onChange={onChangeKo}
          placeholder={placeholderKo}
        />
        <TagInput
          label="English"
          values={valuesEn}
          onChange={onChangeEn}
          placeholder={placeholderEn}
        />
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-base font-semibold text-gray-900">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          checked ? 'bg-blue-600' : 'bg-gray-300',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-5',
          )}
        />
      </button>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
}

export function ToolForm({
  categories,
  subCategories,
  initialTool,
  viewCount30d,
}: ToolFormProps) {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const isEdit = Boolean(initialTool);
  const defaultCategorySlug = categories[0]?.slug ?? '';

  const [values, setValues] = useState<ToolFormInput>(() =>
    initialTool
      ? toolToFormInput(initialTool)
      : emptyForm(defaultCategorySlug),
  );
  const [slugEdited, setSlugEdited] = useState(isEdit);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = <K extends keyof ToolFormInput>(
    key: K,
    value: ToolFormInput[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleNameChange = (name: string) => {
    setValues((prev) => {
      const next = { ...prev, name };
      if (!slugEdited) {
        next.slug = generateSlugFromName(name);
      }
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!values.name.trim()) {
      setError('서비스명을 입력해주세요.');
      return;
    }
    if (!values.slug.trim() || !SLUG_PATTERN.test(values.slug)) {
      setError('슬러그 형식을 확인해주세요. (예: chatgpt)');
      return;
    }
    if (!values.homepage_url.trim()) {
      setError('홈페이지 URL을 입력해주세요.');
      return;
    }
    if (values.category_assignments.length === 0) {
      setError('최소 1개의 카테고리 분류가 필요합니다.');
      return;
    }
    if (
      values.free_plan_exists &&
      values.free_limit_type !== 'unlimited' &&
      (values.free_limit_amount == null ||
        !values.free_limit_unit?.trim())
    ) {
      setError('무료 한도 수량과 단위를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...values,
        logo_url: values.logo_url || null,
        name_en: values.name_en || null,
        description_en: values.description_en || null,
        free_description: values.free_description || null,
        free_description_en: values.free_description_en || null,
        free_plan_url: values.free_plan_url || null,
        tip: values.tip || null,
        tip_en: values.tip_en || null,
        free_limit_unit:
          values.free_plan_exists && values.free_limit_type !== 'unlimited'
            ? values.free_limit_unit
            : null,
        free_limit_unit_en:
          values.free_plan_exists && values.free_limit_type !== 'unlimited'
            ? values.free_limit_unit_en || null
            : null,
        free_limit_amount:
          values.free_plan_exists && values.free_limit_type !== 'unlimited'
            ? values.free_limit_amount
            : null,
      };

      const response = await fetch(
        isEdit ? `/api/admin/tools/${initialTool!.id}` : '/api/admin/tools',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) await parseApiError(response);

      showToast(
        isEdit ? '툴 정보가 저장되었습니다.' : '새 툴이 등록되었습니다.',
        'success',
      );

      if (isEdit) {
        router.refresh();
      } else {
        router.push('/admin/tools');
        router.refresh();
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : '저장에 실패했습니다.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
        <Section title="기본 정보">
          <BilingualField label="서비스명" required>
            <BilingualInput
              idKo="name"
              idEn="name_en"
              valueKo={values.name}
              valueEn={values.name_en}
              onChangeKo={handleNameChange}
              onChangeEn={(value) => updateField('name_en', value)}
              placeholderKo="ChatGPT"
              placeholderEn="ChatGPT"
              requiredKo
            />
          </BilingualField>

          <div>
            <label htmlFor="slug" className={LABEL_CLASS}>
              슬러그 <span className="text-red-500">*</span>
            </label>
            <input
              id="slug"
              type="text"
              required
              value={values.slug}
              onChange={(event) => {
                setSlugEdited(true);
                updateField('slug', event.target.value);
              }}
              className={cn(INPUT_CLASS, 'font-mono')}
              placeholder="chatgpt"
            />
            <p className="mt-1 text-xs text-gray-500">
              서비스명 입력 시 자동 생성됩니다. 영문 소문자, 숫자, 하이픈만
              사용 가능합니다.
            </p>
          </div>

          <div>
            <span className={LABEL_CLASS}>카테고리 / 서브카테고리</span>
            <p className="mb-3 text-xs text-gray-500">
              한 툴을 여러 카테고리·서브카테고리에 동시에 노출할 수 있습니다. 첫
              번째 항목이 주 분류입니다.
            </p>
            <CategoryAssignmentsEditor
              assignments={values.category_assignments}
              categories={categories}
              subCategories={subCategories}
              onChange={(nextAssignments) =>
                setValues((prev) => ({
                  ...prev,
                  category_assignments: nextAssignments,
                  category_slug: nextAssignments[0]?.category_slug ?? '',
                  sub_category: nextAssignments[0]?.sub_category ?? null,
                }))
              }
            />
          </div>

          <div>
            <label htmlFor="homepage_url" className={LABEL_CLASS}>
              홈페이지 URL <span className="text-red-500">*</span>
            </label>
            <input
              id="homepage_url"
              type="url"
              required
              value={values.homepage_url}
              onChange={(event) =>
                updateField('homepage_url', event.target.value)
              }
              className={INPUT_CLASS}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label htmlFor="logo_url" className={LABEL_CLASS}>
              로고 URL
            </label>
            <input
              id="logo_url"
              type="url"
              value={values.logo_url ?? ''}
              onChange={(event) => updateField('logo_url', event.target.value)}
              className={INPUT_CLASS}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <BilingualField label="설명">
            <BilingualInput
              idKo="description"
              idEn="description_en"
              valueKo={values.description}
              valueEn={values.description_en}
              onChangeKo={(value) => updateField('description', value)}
              onChangeEn={(value) => updateField('description_en', value)}
              placeholderKo="서비스에 대한 간단한 설명"
              placeholderEn="Brief description in English"
              rows={4}
            />
          </BilingualField>
        </Section>

        <Section title="무료 정보">
          <Toggle
            checked={values.free_plan_exists}
            onChange={(checked) => updateField('free_plan_exists', checked)}
            label="무료 플랜 존재"
          />

          {values.free_plan_exists && (
            <>
              <div>
                <label htmlFor="free_limit_type" className={LABEL_CLASS}>
                  한도 유형
                </label>
                <select
                  id="free_limit_type"
                  value={values.free_limit_type}
                  onChange={(event) =>
                    updateField(
                      'free_limit_type',
                      event.target.value as FreeLimitType,
                    )
                  }
                  className={INPUT_CLASS}
                >
                  {(
                    Object.entries(FREE_LIMIT_TYPE_LABELS) as [
                      FreeLimitType,
                      string,
                    ][]
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {values.free_limit_type !== 'unlimited' && (
                <>
                  <div>
                    <label htmlFor="free_limit_amount" className={LABEL_CLASS}>
                      한도 수량
                    </label>
                    <input
                      id="free_limit_amount"
                      type="number"
                      min={0}
                      value={values.free_limit_amount ?? ''}
                      onChange={(event) =>
                        updateField(
                          'free_limit_amount',
                          event.target.value === ''
                            ? null
                            : Number(event.target.value),
                        )
                      }
                      className={INPUT_CLASS}
                      placeholder="10"
                    />
                  </div>

                  <BilingualField label="단위">
                    <BilingualInput
                      idKo="free_limit_unit"
                      idEn="free_limit_unit_en"
                      valueKo={values.free_limit_unit ?? ''}
                      valueEn={values.free_limit_unit_en ?? ''}
                      onChangeKo={(value) => updateField('free_limit_unit', value)}
                      onChangeEn={(value) =>
                        updateField('free_limit_unit_en', value)
                      }
                      placeholderKo="회"
                      placeholderEn="times"
                    />
                  </BilingualField>
                </>
              )}

              <BilingualField label="무료 상세 설명">
                <BilingualInput
                  idKo="free_description"
                  idEn="free_description_en"
                  valueKo={values.free_description ?? ''}
                  valueEn={values.free_description_en ?? ''}
                  onChangeKo={(value) => updateField('free_description', value)}
                  onChangeEn={(value) =>
                    updateField('free_description_en', value)
                  }
                  placeholderKo="예) GPT-4o mini 무료 사용 가능, 하루 이미지 생성 10회"
                  placeholderEn="e.g. GPT-4o mini free tier, 10 image generations per day"
                  rows={3}
                />
              </BilingualField>

              <div>
                <label htmlFor="free_plan_url" className={LABEL_CLASS}>
                  무료 플랜 직접 링크
                </label>
                <input
                  id="free_plan_url"
                  type="url"
                  value={values.free_plan_url ?? ''}
                  onChange={(event) =>
                    updateField('free_plan_url', event.target.value)
                  }
                  className={INPUT_CLASS}
                  placeholder="https://example.com/pricing"
                />
              </div>
            </>
          )}
        </Section>

        <Section title="추가 정보">
          <BilingualTagInput
            label="무료 기능"
            valuesKo={values.free_features}
            valuesEn={values.free_features_en}
            onChangeKo={(next) => updateField('free_features', next)}
            onChangeEn={(next) => updateField('free_features_en', next)}
            placeholderKo="무료 기능 입력 후 Enter"
            placeholderEn="Enter free feature and press Enter"
          />

          <BilingualTagInput
            label="유료 전용 기능"
            valuesKo={values.paid_only_features}
            valuesEn={values.paid_only_features_en}
            onChangeKo={(next) => updateField('paid_only_features', next)}
            onChangeEn={(next) => updateField('paid_only_features_en', next)}
            placeholderKo="유료 기능 입력 후 Enter"
            placeholderEn="Enter paid feature and press Enter"
          />

          <BilingualField label="사용 팁">
            <BilingualInput
              idKo="tip"
              idEn="tip_en"
              valueKo={values.tip ?? ''}
              valueEn={values.tip_en ?? ''}
              onChangeKo={(value) => updateField('tip', value)}
              onChangeEn={(value) => updateField('tip_en', value)}
              placeholderKo="사용자에게 도움이 되는 팁"
              placeholderEn="Helpful tip for users"
              rows={3}
            />
          </BilingualField>

          <BilingualTagInput
            label="태그"
            valuesKo={values.tags}
            valuesEn={values.tags_en}
            onChangeKo={(next) => updateField('tags', next)}
            onChangeEn={(next) => updateField('tags_en', next)}
            placeholderKo="태그 입력 후 Enter"
            placeholderEn="Enter tag and press Enter"
          />
        </Section>

        <Section title="관리">
          {isEdit && initialTool && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              툴 상세 페이지 조회수:{' '}
              <span className="font-semibold tabular-nums text-gray-900">
                누적 {initialTool.view_count.toLocaleString('ko-KR')}
              </span>
              {viewCount30d !== undefined && (
                <>
                  {' '}
                  · 30일{' '}
                  <span className="font-semibold tabular-nums text-gray-900">
                    {viewCount30d.toLocaleString('ko-KR')}
                  </span>
                </>
              )}
              <span className="mt-1 block text-xs text-gray-400">
                /tool/{initialTool.slug} 방문 시 집계 (IP당 24시간 1회) ·{' '}
                <Link href="/admin/analytics" className="text-blue-600 hover:underline">
                  기간별 통계
                </Link>
              </span>
            </div>
          )}
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
            <Toggle
              checked={values.is_verified}
              onChange={(checked) => updateField('is_verified', checked)}
              label="검증 완료"
            />
            <Toggle
              checked={values.is_sponsored}
              onChange={(checked) => updateField('is_sponsored', checked)}
              label="스폰서"
            />
          </div>
        </Section>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pb-8">
          <Link
            href="/admin/tools"
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '저장 중…' : isEdit ? '저장' : '등록'}
          </button>
        </div>
      </form>

      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
