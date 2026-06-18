import { Check, ChevronRight, ExternalLink, Info, X } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AdSlot } from '@/components/ads/AdSlot';
import { AdSidebar } from '@/components/ads/AdSidebar';
import { SoftwareApplicationJsonLd } from '@/components/seo/JsonLd';
import { ExternalToolLink } from '@/components/tool/ExternalToolLink';
import { RelatedToolItem } from '@/components/tool/RelatedToolItem';
import { ToolReviews } from '@/components/tool/ToolReviews';
import { ViewCountTracker } from '@/components/tool/ViewCountTracker';
import { Badge } from '@/components/ui/Badge';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { ToolLogo } from '@/components/ui/ToolLogo';
import { CATEGORIES } from '@/constants/categories';
import { getToolAssignments } from '@/lib/tool-categories';
import {
  getAllCategories,
  getAllToolSlugs,
  getAllSubCategories,
  getRelatedTools,
  getToolBySlug,
} from '@/lib/supabase/queries';
import { localizeCategories, localizeCategory, localizeTool, localizeTools } from '@/lib/i18n/content';
import { getLocale, getTranslations } from '@/lib/locale';
import { buildSubCategoryNameMap } from '@/lib/sub-categories';
import { formatDate, formatFreeLimit } from '@/lib/utils';
import type { FreeLimitType, Tool } from '@/types/tool';

export const revalidate = 3600;

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

const LIMIT_TYPE_LABELS: Record<FreeLimitType, string> = {
  daily: '일별',
  monthly: '월별',
  total: '총량',
  unlimited: '무제한',
};

function getCategoryName(slug: string, dbName?: string | null) {
  if (dbName) return dbName;
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

function FeatureComparisonTable({ tool }: { tool: Tool }) {
  const freeSet = new Set(tool.free_features);
  const allFeatures = [
    ...new Set([...tool.free_features, ...tool.paid_only_features]),
  ];

  if (allFeatures.length === 0) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-bold text-gray-900">무료 vs 유료 기능</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="pb-3 pr-4 font-medium text-gray-500">기능</th>
              <th className="pb-3 px-4 text-center font-medium text-gray-500">
                무료
              </th>
              <th className="pb-3 pl-4 text-center font-medium text-gray-500">
                유료
              </th>
            </tr>
          </thead>
          <tbody>
            {allFeatures.map((feature) => {
              const inFree = freeSet.has(feature);
              return (
                <tr key={feature} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 pr-4 text-gray-900">{feature}</td>
                  <td className="py-3 px-4 text-center">
                    {inFree ? (
                      <Check className="mx-auto h-5 w-5 text-green-600" />
                    ) : (
                      <X className="mx-auto h-5 w-5 text-gray-300" />
                    )}
                  </td>
                  <td className="py-3 pl-4 text-center">
                    <Check className="mx-auto h-5 w-5 text-green-600" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export async function generateStaticParams() {
  const slugs = await getAllToolSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations();

  let tool: Tool;
  try {
    tool = localizeTool(await getToolBySlug(slug), locale);
  } catch {
    notFound();
  }

  const assignments = getToolAssignments(tool);
  const [categories, subCategories, relatedToolsRaw] = await Promise.all([
    getAllCategories(),
    getAllSubCategories(),
    getRelatedTools(
      assignments.map((row) => row.category_slug),
      tool.id,
    ),
  ]);

  const localizedCategories = localizeCategories(categories, locale);
  const categoryNameMap = Object.fromEntries(
    localizedCategories.map((item) => [item.slug, item.name]),
  );
  const subNameMap = buildSubCategoryNameMap(subCategories, locale);
  const localizedCategory = localizedCategories.find(
    (item) => item.slug === tool.category_slug,
  );
  const categoryName =
    categoryNameMap[tool.category_slug] ?? tool.category_slug;
  const relatedTools = localizeTools(relatedToolsRaw, locale);
  const ctaUrl = tool.free_plan_url ?? tool.homepage_url;
  const freeLimitText = formatFreeLimit(
    tool.free_limit_type,
    tool.free_limit_amount,
    tool.free_limit_unit,
    locale,
  );
  const limitTypeLabels: Record<FreeLimitType, string> =
    locale === 'en'
      ? {
          daily: 'Daily',
          monthly: 'Monthly',
          total: 'Total',
          unlimited: 'Unlimited',
        }
      : LIMIT_TYPE_LABELS;

  return (
    <>
      <SoftwareApplicationJsonLd
        name={tool.name}
        description={tool.description}
        applicationCategory={categoryName}
        url={tool.homepage_url}
      />

      <div className="mx-auto max-w-7xl overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid min-w-0 gap-8 lg:grid-cols-3">
          {/* 좌측 본문 (2/3) */}
          <div className="min-w-0 space-y-8 lg:col-span-2">
            {/* 브레드크럼 */}
            <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
              <Link href="/" className="hover:text-gray-900">
                {t('nav.home')}
              </Link>
              <ChevronRight className="h-4 w-4 shrink-0" />
              <Link
                href={`/category/${tool.category_slug}`}
                className="hover:text-gray-900"
              >
                {categoryName}
              </Link>
              <ChevronRight className="h-4 w-4 shrink-0" />
              <span className="font-medium text-gray-900">{tool.name}</span>
            </nav>

            {/* 헤더 */}
            <div className="flex min-w-0 items-start justify-between gap-3 sm:gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                <ToolLogo
                  name={tool.name}
                  logoUrl={tool.logo_url}
                  className="shrink-0 rounded-xl"
                />
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
                    {tool.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {assignments.map((assignment) => {
                      const name =
                        categoryNameMap[assignment.category_slug] ??
                        assignment.category_slug;
                      const subName = assignment.sub_category
                        ? subNameMap[assignment.sub_category]
                        : null;
                      const label = subName ? `${name} · ${subName}` : name;

                      return (
                        <Link
                          key={`${assignment.category_slug}-${assignment.sub_category ?? 'none'}`}
                          href={
                            assignment.sub_category
                              ? `/category/${assignment.category_slug}?sub=${assignment.sub_category}`
                              : `/category/${assignment.category_slug}`
                          }
                        >
                          <Badge variant="blue">{label}</Badge>
                        </Link>
                      );
                    })}
                    <ExternalToolLink
                      toolName={tool.name}
                      href={tool.homepage_url}
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      공식 사이트
                      <ExternalLink className="h-3.5 w-3.5" />
                    </ExternalToolLink>
                  </div>
                </div>
              </div>
              <FavoriteButton
                toolId={tool.id}
                toolName={tool.name}
                size="md"
                className="shrink-0"
              />
            </div>

            {/* 무료 한도 카드 */}
            <div className="rounded-xl border-2 border-green-500 bg-green-50/50 p-6">
              <p className="text-sm font-medium text-green-700">
                {locale === 'en' ? 'Free limit' : '무료 한도'}
              </p>
              <p className="mt-1 text-3xl font-bold text-green-800">
                {freeLimitText}
              </p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-gray-500">
                    {locale === 'en' ? 'Limit type' : '한도 유형'}
                  </dt>
                  <dd className="font-medium text-gray-900">
                    {limitTypeLabels[tool.free_limit_type]}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">
                    {locale === 'en' ? 'Reset cycle' : '리셋 주기'}
                  </dt>
                  <dd className="font-medium text-gray-900">
                    {tool.free_limit_type === 'unlimited'
                      ? '-'
                      : limitTypeLabels[tool.free_limit_type]}
                  </dd>
                </div>
              </dl>
              {tool.verified_date && (
                <p className="mt-4 text-xs text-gray-500">
                  {locale === 'en' ? 'Verified: ' : '검증일: '}
                  {formatDate(tool.verified_date, locale)}
                </p>
              )}
            </div>

            {/* 무료 상세 설명 */}
            {tool.free_description && (
              <section className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="text-xl font-bold text-gray-900">
                  무료 플랜 상세
                </h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-gray-700">
                  {tool.free_description}
                </p>
              </section>
            )}

            <AdSlot slotKey="DETAIL_BTM" variant="banner" />

            <FeatureComparisonTable tool={tool} />

            {tool.tip && (
              <section>
                <div className="flex gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                  <div>
                    <p className="font-medium text-brand-900">
                      {locale === 'en' ? 'Tip' : '팁'}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-brand-800">
                      {tool.tip}
                    </p>
                  </div>
                </div>
              </section>
            )}

            <ToolReviews toolId={tool.id} />
          </div>

          {/* 우측 사이드바 (1/3) */}
          <aside className="min-w-0 space-y-6">
            <div className="sticky top-24 space-y-6">
              <ExternalToolLink
                toolName={tool.name}
                href={ctaUrl}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                지금 무료로 시작하기
                <ExternalLink className="h-4 w-4" />
              </ExternalToolLink>

              <AdSidebar />

              {relatedTools.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h3 className="font-semibold text-gray-900">관련 서비스</h3>
                  <div className="mt-3 space-y-2">
                    {relatedTools.map((related) => (
                      <RelatedToolItem key={related.id} tool={related} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <ViewCountTracker
        toolId={tool.id}
        toolName={tool.name}
        category={categoryName}
      />
    </>
  );
}
