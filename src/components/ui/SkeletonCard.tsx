/** ToolCard와 동일한 레이아웃의 로딩 스켈레톤 */
export function SkeletonCard() {
  return (
    <div className="flex animate-pulse flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-3 pr-8">
        <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-200" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-gray-200" />
          <div className="h-5 w-16 rounded-full bg-gray-200" />
        </div>
      </div>
      <div className="mb-2 h-5 w-24 rounded-full bg-gray-200" />
      <div className="mb-4 space-y-2">
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-4/5 rounded bg-gray-200" />
      </div>
      <div className="border-t border-gray-100 pt-3">
        <div className="ml-auto h-4 w-20 rounded bg-gray-200" />
      </div>
    </div>
  );
}

export function SkeletonCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}
