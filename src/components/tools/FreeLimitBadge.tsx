'use client';

import { Badge } from '@/components/ui/Badge';
import { useLocale } from '@/contexts/LocaleContext';
import { formatFreeLimit } from '@/lib/utils';
import type { FreeLimitType } from '@/types/tool';

interface FreeLimitBadgeProps {
  type: FreeLimitType;
  amount?: number | null;
  unit?: string | null;
  className?: string;
}

export function FreeLimitBadge({
  type,
  amount = null,
  unit = null,
  className,
}: FreeLimitBadgeProps) {
  const { locale, t } = useLocale();
  const label = `${formatFreeLimit(type, amount, unit, locale)} ${t('tool.freeSuffix')}`;

  return (
    <Badge variant="green" className={className}>
      {label}
    </Badge>
  );
}
