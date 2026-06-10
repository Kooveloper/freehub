import Link from 'next/link';

import { ToolLogo } from '@/components/ui/ToolLogo';
import type { Tool } from '@/types/tool';

/** 사이드바 관련 툴 링크 */
export function RelatedToolItem({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tool/${tool.slug}`}
      className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50/50"
    >
      <ToolLogo name={tool.name} logoUrl={tool.logo_url} size={40} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">
          {tool.name}
        </p>
        <p className="truncate text-xs text-gray-500">{tool.description}</p>
      </div>
    </Link>
  );
}
