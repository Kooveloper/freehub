import { cn } from '@/lib/utils';

interface HomeSectionTitleProps {
  title: string;
  subtitle?: string;
  dark?: boolean;
  className?: string;
}

/** 홈 섹션 공통 타이틀 */
export function HomeSectionTitle({
  title,
  subtitle,
  dark = false,
  className,
}: HomeSectionTitleProps) {
  return (
    <div className={cn('mb-8 text-center', className)}>
      <h2
        className={cn(
          'text-2xl font-bold tracking-tight sm:text-3xl',
          dark ? 'text-white' : 'text-neutral-900',
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            'mt-2 text-sm sm:text-base',
            dark ? 'text-neutral-400' : 'text-neutral-500',
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
