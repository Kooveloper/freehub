'use client';

import { ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';

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
}

export function ToolCard({
  tool,
  favoriteIds = [],
  categoryName,
}: ToolCardProps) {
  const { t } = useLocale();
  const isFavorited = favoriteIds.includes(tool.id);
  const category =
    categoryName ??
    CATEGORIES.find((c) => c.slug === tool.category_slug)?.name;

  return (
    <Link
      href={`/tool/${tool.slug}`}
      className={cn(
        'group relative flex flex-col rounded-xl border bg-white p-4 shadow-sm shadow-brand-900/5 transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md hover:shadow-brand-900/10',
        isFavorited ? 'border-yellow-400 ring-1 ring-yellow-400' : 'border-gray-200',
      )}
    >
      {isFavorited && (
        <div className="absolute left-3 top-3 z-10">
          <Badge variant="yellow" className="gap-1">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            {t('tool.favorite')}
          </Badge>
        </div>
      )}

      {tool.is_sponsored && (
        <div className="absolute right-12 top-3 z-10">
          <Badge variant="orange" className="text-[10px] font-bold tracking-wide">
            SPONSORED
          </Badge>
        </div>
      )}

      <div className="absolute right-3 top-3 z-10">
        <FavoriteButton toolId={tool.id} toolName={tool.name} size="sm" />
      </div>

      <div className="mb-3 flex items-center gap-3 pr-8">
        <ToolLogo name={tool.name} logoUrl={tool.logo_url} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-gray-900 group-hover:text-brand-600">
            {tool.name}
          </h3>
          {category && (
            <Badge variant="blue" className="mt-1">
              {category}
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
        <span className="flex items-center gap-1 text-sm font-medium text-brand-600 transition-colors group-hover:text-brand-700">
          {t('tool.viewDetails')}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
