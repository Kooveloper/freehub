/**
 * 카테고리 시드 데이터
 * DB categories 테이블과 slug·name·icon·color를 맞춰 사용합니다.
 */
export const CATEGORIES = [
  {
    slug: 'ai-chat',
    name: 'AI 채팅',
    icon: 'MessageSquare',
    color: '#3B82F6',
    description: 'ChatGPT, Claude 등 AI 대화·어시스턴트 도구',
  },
  {
    slug: 'ai-image',
    name: 'AI 이미지',
    icon: 'Image',
    color: '#8B5CF6',
    description: '이미지 생성·편집 AI 도구',
  },
  {
    slug: 'ai-writing',
    name: 'AI 글쓰기',
    icon: 'PenLine',
    color: '#10B981',
    description: '콘텐츠·카피·번역 AI 도구',
  },
  {
    slug: 'ai-video',
    name: 'AI 영상',
    icon: 'Video',
    color: '#F59E0B',
    description: '영상 생성·편집 AI 도구',
  },
  {
    slug: 'ai-audio',
    name: 'AI 오디오',
    icon: 'Mic',
    color: '#EC4899',
    description: '음성·음악 생성 AI 도구',
  },
  {
    slug: 'productivity',
    name: '생산성',
    icon: 'Zap',
    color: '#06B6D4',
    description: '업무·협업·자동화 도구',
  },
  {
    slug: 'design',
    name: '디자인',
    icon: 'Palette',
    color: '#F97316',
    description: 'UI·그래픽·프레젠테이션 도구',
  },
  {
    slug: 'dev-tools',
    name: '개발 도구',
    icon: 'Code2',
    color: '#6366F1',
    description: '코딩·배포·API 개발 도구',
  },
  {
    slug: 'marketing',
    name: '마케팅',
    icon: 'TrendingUp',
    color: '#EF4444',
    description: 'SEO·광고·소셜미디어 도구',
  },
  {
    slug: 'data-analytics',
    name: '데이터·분석',
    icon: 'BarChart3',
    color: '#14B8A6',
    description: '데이터 시각화·BI·스크래핑 도구',
  },
] as const;
