'use client';

import { ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';

import { CategoryIcon } from '@/components/category/CategoryIcon';
import { Badge } from '@/components/ui/Badge';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { ToolLogo } from '@/components/ui/ToolLogo';
import { useLocale } from '@/contexts/LocaleContext';
import { CATEGORIES } from '@/constants/categories';
import { cn } from '@/lib/utils';
import type { Tool } from '@/types/tool';

import { FreeLimitBadge } from './FreeLimitBadge';

interface ToolCardProps {
  tool: Tool;
  favoriteIds?: string[];
  categoryName?: string;
  categoryIcon?: string;
  subCategoryName?: string;
}

export function ToolCard({
  tool,
  favoriteIds = [],
  categoryName,
  categoryIcon,
  subCategoryName,
}: ToolCardProps) {
  const { t } = useLocale();
  const isFavorited = favoriteIds.includes(tool.id);
  const category =
    categoryName ??
    CATEGORIES.find((c) => c.slug === tool.category_slug)?.name;
  const icon =
    categoryIcon ??
    CATEGORIES.find((c) => c.slug === tool.category_slug)?.icon;

  const categoryLabel = subCategoryName
    ? `${category ?? ''} · ${subCategoryName}`.replace(/^ · /, '')
    : category;

  return (
    <Link
      href={`/tool/${tool.slug}`}
      className={cn(
        'group relative flex flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-md',
        isFavorited ? 'border-yellow-400 ring-1 ring-yellow-400' : 'border-gray-200',
      )}
    >
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
        {isFavorited && (
          <Badge variant="yellow" className="gap-1">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            {t('tool.favorite')}
          </Badge>
        )}
        {tool.is_sponsored && (
          <Badge variant="orange" className="text-[10px] font-bold tracking-wide">
            SPONSORED
          </Badge>
        )}
        <FavoriteButton toolId={tool.id} toolName={tool.name} size="sm" />
      </div>

      <div className="mb-3 flex items-center gap-3 pr-8">
        <ToolLogo name={tool.name} logoUrl={tool.logo_url} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-neutral-900 group-hover:text-black">
            {tool.name}
          </h3>
          {categoryLabel && (
            <Badge variant="blue" className="mt-1 inline-flex max-w-full items-center gap-1">
              {icon && (
                <CategoryIcon name={icon} size={14} className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">{categoryLabel}</span>
            </Badge>
          )}
        </div>
      </div>

      {tool.free_plan_exists && (
        <div className="mb-2">
          <FreeLimitBadge
            type={tool.free_limit_type}
            amount={tool.free_limit_amount}
            unit={tool.free_limit_unit}
          />
        </div>
      )}

      <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-gray-500">
        {tool.description}
      </p>

      <div className="flex items-center justify-end border-t border-gray-100 pt-3">
        <span className="flex items-center gap-1 text-sm font-medium text-neutral-700 transition-colors group-hover:text-black">
          {t('tool.viewDetails')}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
