import { Star } from 'lucide-react';

/** 리뷰 섹션 — 추후 DB 연동 예정 */
export function ToolReviews() {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-bold text-gray-900">리뷰</h2>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className="h-5 w-5 fill-gray-200 text-gray-200"
            />
          ))}
        </div>
        <span className="text-sm text-gray-400">아직 리뷰가 없습니다</span>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        이 서비스를 사용해 보셨나요? 리뷰 기능은 곧 제공될 예정입니다.
      </p>
    </section>
  );
}
