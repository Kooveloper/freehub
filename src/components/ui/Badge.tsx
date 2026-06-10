import { cn } from '@/lib/utils';

const VARIANT_STYLES = {
  default: 'bg-gray-100 text-gray-700',
  green: 'bg-green-50 text-green-700',
  blue: 'bg-brand-50 text-brand-700',
  red: 'bg-red-50 text-red-700',
  yellow: 'bg-yellow-50 text-yellow-700',
  gray: 'bg-gray-100 text-gray-600',
  orange: 'bg-orange-50 text-orange-700',
} as const;

export type BadgeVariant = keyof typeof VARIANT_STYLES;

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = 'default',
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
