interface LegalPageContentProps {
  content: string;
}

/** 간단한 마크다운 스타일 렌더링 (## 제목, 문단) */
export function LegalPageContent({ content }: LegalPageContentProps) {
  const blocks = content.split(/\n\n+/).filter(Boolean);

  return (
    <div className="space-y-8 text-sm leading-7 text-gray-700">
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={index}
              className="text-lg font-semibold text-gray-900"
            >
              {trimmed.replace(/^##\s+/, '')}
            </h2>
          );
        }
        if (trimmed.startsWith('- ')) {
          const items = trimmed.split('\n').map((line) => line.replace(/^-\s+/, ''));
          return (
            <ul key={index} className="list-disc space-y-2 pl-5">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="whitespace-pre-line">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}
