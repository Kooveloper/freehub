interface ViewStatsCellProps {
  lifetime: number;
  period?: number;
  periodLabel?: string;
}

export function ViewStatsCell({
  lifetime,
  period,
  periodLabel = '30일',
}: ViewStatsCellProps) {
  return (
    <div className="inline-flex flex-col items-center tabular-nums text-gray-700">
      <div className="font-medium">{lifetime.toLocaleString('ko-KR')}</div>
      {period !== undefined && (
        <div className="mt-0.5 text-xs text-gray-500">
          {periodLabel}{' '}
          <span className="text-gray-600">
            {period.toLocaleString('ko-KR')}
          </span>
        </div>
      )}
    </div>
  );
}
