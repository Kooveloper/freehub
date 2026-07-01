export interface BlogContentSplit {
  before: string;
  after: string;
}

const MIN_HTML_LENGTH = 600;
const MIN_PARAGRAPHS = 4;

function findTagEndIndices(html: string, pattern: RegExp): number[] {
  const indices: number[] = [];
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const regex = new RegExp(pattern.source, flags);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    indices.push(match.index + match[0].length);
  }

  return indices;
}

/**
 * 블로그 본문 중간에 광고를 넣을 분할 지점.
 * - 2번째 h2 뒤 우선
 * - 없으면 단락 4개 이상일 때 중간 단락 뒤
 * - 본문이 짧으면 null (광고 없이 전체 렌더)
 */
export function splitBlogContentForMidAd(html: string): BlogContentSplit | null {
  const trimmed = html.trim();
  if (trimmed.length < MIN_HTML_LENGTH) return null;

  const h2Ends = findTagEndIndices(trimmed, /<\/h2>/gi);
  if (h2Ends.length >= 2) {
    const splitAt = h2Ends[1]!;
    return {
      before: trimmed.slice(0, splitAt),
      after: trimmed.slice(splitAt),
    };
  }

  const paragraphEnds = findTagEndIndices(trimmed, /<\/p>/gi);
  if (paragraphEnds.length >= MIN_PARAGRAPHS) {
    const midIndex = Math.floor(paragraphEnds.length / 2);
    const splitAt = paragraphEnds[midIndex - 1]!;
    return {
      before: trimmed.slice(0, splitAt),
      after: trimmed.slice(splitAt),
    };
  }

  return null;
}
