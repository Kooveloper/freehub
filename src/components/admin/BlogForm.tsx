'use client';

import { ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Toast, useToast } from '@/components/admin/Toast';
import { CATEGORIES } from '@/constants/categories';
import { generateBlogSlug } from '@/lib/blog-utils';
import { cn } from '@/lib/utils';
import type { BlogPost, BlogPostSource, BlogPostStatus } from '@/types/blog';

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

interface BlogFormProps {
  initialPost?: BlogPost;
  source?: BlogPostSource;
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function BlogForm({ initialPost, source = 'manual' }: BlogFormProps) {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const isEdit = Boolean(initialPost);

  const [title, setTitle] = useState(initialPost?.title ?? '');
  const [slug, setSlug] = useState(initialPost?.slug ?? '');
  const [slugManual, setSlugManual] = useState(isEdit);
  const [content, setContent] = useState(initialPost?.content ?? '');
  const [editorTab, setEditorTab] = useState<'html' | 'preview'>('html');
  const [status, setStatus] = useState<BlogPostStatus>(
    initialPost?.status ?? 'draft',
  );
  const [publishedAt, setPublishedAt] = useState(
    toDatetimeLocal(initialPost?.published_at ?? null),
  );
  const [metaDescription, setMetaDescription] = useState(
    initialPost?.meta_description ?? '',
  );
  const [category, setCategory] = useState(initialPost?.category ?? '');
  const [tags, setTags] = useState<string[]>(initialPost?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slugManual && title) {
      setSlug(generateBlogSlug(title));
    }
  }, [title, slugManual]);

  const addTag = () => {
    const value = tagInput.trim();
    if (!value || tags.includes(value)) return;
    setTags((prev) => [...prev, value]);
    setTagInput('');
  };

  const save = async (nextStatus: BlogPostStatus) => {
    if (!title.trim() || !content.trim()) {
      showToast('제목과 본문을 입력해주세요.', 'error');
      return;
    }

    const finalSlug = slug.trim() || generateBlogSlug(title);
    setSaving(true);

    try {
      const payload = {
        title: title.trim(),
        slug: finalSlug,
        content,
        meta_description: metaDescription.trim() || null,
        tags,
        category: category || null,
        status: nextStatus,
        source: initialPost?.source ?? source,
        published_at:
          nextStatus === 'published' ? new Date(publishedAt).toISOString() : null,
      };

      const res = await fetch(
        isEdit ? `/api/admin/blog/${initialPost!.id}` : '/api/admin/blog',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? '저장 실패');
      }

      const { post } = await res.json();
      showToast(
        nextStatus === 'published' ? '글이 발행되었습니다.' : '임시저장되었습니다.',
        'success',
      );
      setStatus(nextStatus);

      if (!isEdit) {
        router.push(`/admin/blog/${post.id}`);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : '저장 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewClick = () => {
    if (!slug) return;
    if (!initialPost) {
      showToast('임시저장 후 미리보기할 수 있습니다.', 'error');
      setEditorTab('preview');
      return;
    }
    window.open(`/admin/blog/preview/${slug}`, '_blank', 'noopener,noreferrer');
  };
  const metaLeft = 150 - metaDescription.length;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="블로그 글 제목을 입력하세요"
            className="w-full border-0 border-b border-gray-200 bg-transparent px-0 py-3 text-2xl font-bold text-gray-900 placeholder:text-gray-300 focus:border-blue-500 focus:outline-none focus:ring-0"
          />

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-medium text-gray-600">슬러그</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugManual(true);
                setSlug(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                );
              }}
              className={cn(INPUT_CLASS, 'max-w-md font-mono text-xs')}
            />
            {slug && (
              <button
                type="button"
                onClick={handlePreviewClick}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                미리보기
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-2 border-b border-gray-200">
            {(['html', 'preview'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setEditorTab(tab)}
                className={cn(
                  'px-4 py-2 text-sm font-medium',
                  editorTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {tab === 'html' ? 'HTML 작성' : '미리보기'}
              </button>
            ))}
          </div>

          {editorTab === 'html' ? (
            <div>
              <p className="mb-2 text-xs text-gray-500">
                HTML 형식으로 작성하세요. n8n 자동화로 생성된 콘텐츠를 그대로
                붙여넣기 가능합니다.
              </p>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={22}
                className={cn(INPUT_CLASS, 'min-h-[500px] font-mono text-xs')}
              />
            </div>
          ) : (
            <div
              className="prose prose-lg max-w-none min-h-[500px] rounded-lg border border-gray-200 bg-white p-6"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-900">발행 설정</h3>
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => setStatus('draft')}
                className={cn(
                  'flex-1 rounded-lg border py-2 text-sm font-medium',
                  status === 'draft'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 text-gray-600',
                )}
              >
                초안
              </button>
              <button
                type="button"
                onClick={() => setStatus('published')}
                className={cn(
                  'flex-1 rounded-lg border py-2 text-sm font-medium',
                  status === 'published'
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 text-gray-600',
                )}
              >
                발행
              </button>
            </div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              발행일
            </label>
            <input
              type="datetime-local"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className={cn(INPUT_CLASS, 'mb-3')}
            />
            <p className="mb-3 text-xs text-gray-500">
              출처:{' '}
              {initialPost?.source === 'auto' || source === 'auto'
                ? '🤖 자동'
                : '✍️ 수동'}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => save('draft')}
                className="rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  '임시저장'
                )}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => save('published')}
                className="rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  '발행하기'
                )}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-900">SEO 설정</h3>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              메타 설명
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) =>
                setMetaDescription(e.target.value.slice(0, 150))
              }
              rows={3}
              className={cn(INPUT_CLASS, 'mb-1')}
            />
            <p className="text-xs text-gray-400">{metaLeft}자 남음</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-900">분류</h3>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              연관 카테고리
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={cn(INPUT_CLASS, 'mb-3')}
            >
              <option value="">선택 안 함</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              태그
            </label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() =>
                      setTags((prev) => prev.filter((t) => t !== tag))
                    }
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Enter로 태그 추가"
              className={INPUT_CLASS}
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              SEO 미리보기
            </h3>
            <p className="text-xs text-green-700">freehub.kr/blog/{slug || '…'}</p>
            <p className="mt-1 line-clamp-1 text-sm font-medium text-blue-800">
              {(title || '제목').slice(0, 60)}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">
              {(metaDescription || '메타 설명').slice(0, 160)}
            </p>
          </div>

          <Link
            href="/admin/blog"
            className="block text-center text-sm text-gray-500 hover:text-gray-700"
          >
            ← 목록으로
          </Link>
        </div>
      </div>
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}
