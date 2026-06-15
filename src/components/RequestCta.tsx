import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface RequestCtaProps {
  title: string;
  description: string;
  buttonLabel: string;
}

/** 홈 하단 — 서비스 추가 요청 CTA (제보하기 새 툴 제보 탭) */
export function RequestCta({ title, description, buttonLabel }: RequestCtaProps) {
  return (
    <section className="border-t border-neutral-200 bg-gradient-to-b from-white to-neutral-50 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[450px] max-w-3xl flex-col items-center justify-center py-20 sm:py-24">
        <div className="w-full text-center">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-neutral-500 sm:text-lg">
            {description}
          </p>
          <Link
            href="/submit?tab=new_tool"
            className="group mx-auto mt-10 flex w-full max-w-lg items-center justify-center gap-2.5 rounded-2xl bg-black px-8 py-5 text-base font-semibold text-white shadow-[0_12px_40px_rgba(0,0,0,0.15)] transition hover:bg-neutral-800 hover:shadow-[0_16px_48px_rgba(0,0,0,0.2)] sm:text-lg"
          >
            {buttonLabel}
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
